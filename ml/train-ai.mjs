#!/usr/bin/env node
/**
 * Train HealthGuard medical AI (local, no cloud).
 * 1) Build Ollama model healthguard-med from qwen2.5 + system prompt + few-shot
 * 2) Eval safety/triage rubric
 * 3) Point backend/.env to the new model
 *
 * Does NOT fine-tune on user chat (that amplifies errors).
 * Optional LoRA: python ml/train_lora.py after this gold set exists.
 */
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ML = path.resolve(__dirname);
const ROOT = path.resolve(__dirname, '..');
const OLLAMA = process.env.OLLAMA_HOST || 'http://localhost:11434';
const BASE_MODEL = process.env.OLLAMA_BASE_MODEL || 'qwen2.5:3b-instruct';
const TARGET = process.env.OLLAMA_TRAINED_MODEL || 'healthguard-med';

function read(rel) {
  return fs.readFileSync(path.join(ML, rel), 'utf8');
}

function fold(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function postJson(urlPath, body, timeoutMs = 180000) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlPath, OLLAMA);
    const payload = JSON.stringify(body);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port || 11434,
        path: u.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          resolve({ status: res.statusCode, text });
        });
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    req.write(payload);
    req.end();
  });
}

function getJson(urlPath, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlPath, OLLAMA);
    const req = http.get(
      { hostname: u.hostname, port: u.port || 11434, path: u.pathname, timeout: timeoutMs },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

function buildModelfile(system, shots) {
  const esc = (s) => s.replace(/"""/g, "'''");
  const lines = [
    `FROM ${BASE_MODEL}`,
    'PARAMETER temperature 0.25',
    'PARAMETER top_p 0.9',
    'PARAMETER num_ctx 4096',
    `SYSTEM """${esc(system.trim())}"""`,
  ];
  for (const shot of shots.slice(0, 6)) {
    lines.push(`MESSAGE user ${JSON.stringify(shot.user)}`);
    lines.push(`MESSAGE assistant ${JSON.stringify(shot.assistant)}`);
  }
  return `${lines.join('\n')}\n`;
}

function patchEnv(modelName) {
  const envPath = path.join(ROOT, 'backend', '.env');
  if (!fs.existsSync(envPath)) {
    console.log('  (chưa có backend/.env — bỏ qua ghi OLLAMA_MODEL)');
    return;
  }
  let text = fs.readFileSync(envPath, 'utf8');
  if (/^OLLAMA_MODEL=/m.test(text)) {
    text = text.replace(/^OLLAMA_MODEL=.*$/m, `OLLAMA_MODEL=${modelName}`);
  } else {
    text += `\nOLLAMA_MODEL=${modelName}\n`;
  }
  fs.writeFileSync(envPath, text);
}

async function waitOllama() {
  for (let i = 0; i < 20; i++) {
    try {
      const tags = await getJson('/api/tags');
      return tags;
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error('Ollama không trả lời :11434. Chạy npm run dev:ollama trước.');
}

async function createModel(system, shots) {
  console.log(`\n▸ Tạo model Ollama "${TARGET}" từ ${BASE_MODEL} ...`);
  const messages = [];
  for (const shot of shots.slice(0, 6)) {
    messages.push({ role: 'user', content: shot.user });
    messages.push({ role: 'assistant', content: shot.assistant });
  }
  const bodies = [
    {
      model: TARGET,
      from: BASE_MODEL,
      system,
      parameters: { temperature: 0.25, top_p: 0.9, num_ctx: 4096 },
      messages,
      stream: false,
    },
    {
      model: TARGET,
      from: BASE_MODEL,
      system,
      parameters: { temperature: 0.25, top_p: 0.9 },
      stream: false,
    },
  ];
  let lastErr = '';
  for (const body of bodies) {
    try {
      const res = await postJson('/api/create', body, 300000);
      lastErr = `${res.status} ${res.text.slice(0, 400)}`;
      const okStatus = res.status >= 200 && res.status < 300;
      const okBody = /success|created/i.test(res.text);
      if (okStatus || okBody) {
        console.log('  Đã tạo/cập nhật model.');
        return;
      }
    } catch (e) {
      lastErr = e.message;
    }
  }
  throw new Error(`ollama create thất bại: ${lastErr}`);
}

async function chat(model, q) {
  const res = await postJson(
    '/api/chat',
    { model, messages: [{ role: 'user', content: q }], stream: false, options: { temperature: 0.2 } },
    120000,
  );
  const data = JSON.parse(res.text);
  return data.message?.content || data.response || '';
}

async function evalModel(model, cases) {
  console.log(`\n▸ Đánh giá ${cases.length} tình huống y tế ...`);
  let pass = 0;
  const rows = [];
  for (const c of cases) {
    const answer = await chat(model, c.q);
    const f = fold(answer);
    const missedMust = (c.must || []).filter((w) => !f.includes(fold(w)));
    const hitForbidden = (c.must_not || []).filter((w) => f.includes(fold(w)));
    const ok = missedMust.length === 0 && hitForbidden.length === 0;
    if (ok) pass += 1;
    const mark = ok ? 'PASS' : 'FAIL';
    console.log(`  [${mark}] ${c.id}`);
    if (!ok) {
      if (missedMust.length) console.log(`         thiếu: ${missedMust.join(', ')}`);
      if (hitForbidden.length) console.log(`         không nên có: ${hitForbidden.join(', ')}`);
      console.log(`         trả lời: ${answer.slice(0, 180).replace(/\s+/g, ' ')}...`);
    }
    rows.push({ id: c.id, ok, answer: answer.slice(0, 400) });
  }
  const score = Math.round((pass / cases.length) * 100);
  console.log(`\n  Điểm an toàn/triage: ${pass}/${cases.length}  (${score}%)`);
  return { pass, total: cases.length, score, rows };
}

async function main() {
  console.log('────────────────────────────────────────────');
  console.log('  HealthGuard  ·  train AI y tế (local)');
  console.log('────────────────────────────────────────────');
  console.log('  Chiến lược: RAG + Modelfile (system + few-shot).');
  console.log('  Không train trên chat người dùng (tránh học sai).');
  console.log('  Đây không phải bác sĩ — chỉ trợ lý tham khảo.\n');

  const tags = await waitOllama();
  const names = (tags.models || []).map((m) => m.name);
  const hasBase = names.some((n) => n.startsWith(BASE_MODEL.split(':')[0]));
  if (!hasBase) {
    throw new Error(`Chưa có model gốc ${BASE_MODEL}. Chạy npm run dev:ollama`);
  }
  console.log(`  Ollama OK · models: ${names.join(', ')}`);

  const system = read('prompts/system.vi.txt');
  const shots = JSON.parse(read('data/gold_shots.json'));
  const evalCases = JSON.parse(read('data/eval.json'));

  const jsonl = shots.map((s) =>
    JSON.stringify({
      instruction: 'Bạn là HealthGuard AI — trợ lý sức khỏe tiếng Việt. Không chẩn đoán, không kê đơn.',
      input: s.user,
      output: s.assistant,
    }),
  );
  fs.mkdirSync(path.join(ML, 'data'), { recursive: true });
  fs.writeFileSync(path.join(ML, 'data', 'gold_train.jsonl'), `${jsonl.join('\n')}\n`, 'utf8');

  const modelfile = buildModelfile(system, shots);
  fs.writeFileSync(path.join(ML, 'Modelfile'), modelfile, 'utf8');
  console.log('  Đã ghi ml/Modelfile và ml/data/gold_train.jsonl');

  await createModel(system.trim(), shots);
  const result = await evalModel(TARGET, evalCases);

  patchEnv(TARGET);
  console.log(`\n▸ Đã đặt backend/.env  OLLAMA_MODEL=${TARGET}`);
  console.log('  Khởi động lại API: dừng terminal backend rồi npm run dev:backend');
  console.log('  (Lần start sau, RAG sẽ nhúng lại kiến thức y tế mới.)');
  if (result.score < 70) {
    console.log('\n  Điểm <70%: kiểm tra Ollama đã load model, chạy lại npm run train:ai');
    process.exitCode = 1;
  } else {
    console.log('\n  Training local hoàn tất. Demo chat trên http://localhost:3000/dashboard/chat');
  }
  console.log('');
}

main().catch((err) => {
  console.error(`\n  Lỗi: ${err.message}`);
  process.exit(1);
});
