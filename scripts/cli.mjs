#!/usr/bin/env node
/**
 * HealthGuard CLI — doctor / status / env / urls / help
 * Usage: node scripts/cli.mjs [command] [--json]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import http from 'http';
import https from 'https';
import {
  banner, section, kv, row, table, nextSteps, urls, jsonBlock, hr,
  color, badge,
} from './lib/term.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const VERSION = '1.0.0';

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const cmd = args.find((a) => !a.startsWith('-')) || 'help';

function readDotEnv(filePath) {
  const map = {};
  if (!fs.existsSync(filePath)) return map;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    map[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return map;
}

function maskSecret(key, value) {
  if (value == null || value === '') return '(trống)';
  const k = key.toUpperCase();
  if (k.includes('SECRET') || k.includes('PASSWORD') || k.includes('TOKEN') || k.includes('KEY')) {
    return value.length <= 6 ? '***' : `${value.slice(0, 2)}***${value.slice(-2)} (${value.length} ký tự)`;
  }
  if (k.includes('DATABASE_URL') || k.includes('URL') && k.includes('POSTGRES')) {
    return value.replace(/:([^:@/]+)@/, ':***@');
  }
  return value;
}

function exists(p) {
  return fs.existsSync(p);
}

function tryExec(command, opts = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      timeout: opts.timeout ?? 8000,
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
      cwd: opts.cwd || ROOT,
    }).trim();
  } catch {
    return null;
  }
}

function fetchJson(url, timeoutMs = 4000) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      resolve({ ok: false, status: 0, data: null, ms: 0, error: 'invalid url' });
      return;
    }
    const lib = parsed.protocol === 'https:' ? https : http;
    const started = Date.now();
    const req = lib.get(url, { timeout: timeoutMs }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        let data = null;
        try {
          data = JSON.parse(body);
        } catch {
          data = body;
        }
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 400,
          status: res.statusCode,
          data,
          ms: Date.now() - started,
        });
      });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 0, data: null, ms: Date.now() - started, error: 'timeout' });
    });
    req.on('error', (err) => {
      resolve({ ok: false, status: 0, data: null, ms: Date.now() - started, error: err.message });
    });
  });
}

function fetchText(url, timeoutMs = 4000) {
  return fetchJson(url, timeoutMs);
}

function fmtBytes(n) {
  if (!n && n !== 0) return '—';
  const gb = n / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = n / 1024 ** 2;
  return `${mb.toFixed(0)} MB`;
}

function fmtUptime(sec) {
  if (sec == null) return '—';
  const s = Number(sec);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

function nowStamp() {
  return new Date().toLocaleString('vi-VN', { hour12: false });
}

function uniquePorts(c) {
  if (Array.isArray(c.Publishers) && c.Publishers.length) {
    const set = [...new Set(c.Publishers.map((p) => p.PublishedPort).filter(Boolean))];
    return set.length ? set.join(', ') : '—';
  }
  return c.Ports || '—';
}

async function collect() {
  const backendEnvPath = path.join(ROOT, 'backend', '.env');
  const env = readDotEnv(backendEnvPath);
  const node = process.version;
  const npm = tryExec('npm -v');
  const dockerVersion = tryExec('docker version --format "{{.Server.Version}}"');
  const dockerOk = Boolean(dockerVersion);
  const ollamaCli = Boolean(tryExec('where ollama') || tryExec('command -v ollama'));

  const files = {
    backendEnv: exists(backendEnvPath),
    frontendEnv: exists(path.join(ROOT, 'frontend', '.env.local')),
    desktopEnv: exists(path.join(ROOT, 'desktop', '.env')),
    backendModules: exists(path.join(ROOT, 'backend', 'node_modules')),
    frontendModules: exists(path.join(ROOT, 'frontend', 'node_modules')),
  };

  const [ollamaTags, backendHealth, frontendLogin] = await Promise.all([
    fetchJson('http://localhost:11434/api/tags'),
    fetchJson('http://localhost:3001/api/health'),
    fetchText('http://localhost:3000/login'),
  ]);

  let containers = [];
  if (dockerOk) {
    const raw = tryExec(
      'docker compose ps --format json',
      { cwd: path.join(ROOT, 'backend') },
    );
    if (raw) {
      try {
        const parsed = raw
          .split(/\r?\n/)
          .filter(Boolean)
          .flatMap((line) => {
            const v = JSON.parse(line);
            return Array.isArray(v) ? v : [v];
          });
        containers = parsed.map((c) => ({
          name: c.Name || c.Service || c.Names,
          service: c.Service,
          state: c.State || c.Status,
          health: c.Health,
          ports: uniquePorts(c),
        }));
      } catch {
        const plain = tryExec('docker compose ps', { cwd: path.join(ROOT, 'backend') });
        if (plain) containers = [{ name: plain.split('\n').slice(1).join(' | ') }];
      }
    }
  }

  const models = Array.isArray(ollamaTags.data?.models) ? ollamaTags.data.models : [];
  const expectedChat = env.OLLAMA_MODEL || 'qwen2.5:3b-instruct';
  const expectedEmbed = env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
  const hasChat = models.some((m) => (m.name || '').includes(expectedChat.split(':')[0]));
  const hasEmbed = models.some((m) => (m.name || '').includes(expectedEmbed.split(':')[0]));

  const health = backendHealth.ok && backendHealth.data && typeof backendHealth.data === 'object'
    ? backendHealth.data
    : null;

  return {
    at: new Date().toISOString(),
    node,
    npm,
    dockerOk,
    dockerVersion,
    ollamaCli,
    files,
    env: {
      AI_PROVIDER: env.AI_PROVIDER || null,
      OLLAMA_MODEL: env.OLLAMA_MODEL || null,
      OLLAMA_EMBED_MODEL: env.OLLAMA_EMBED_MODEL || null,
      OLLAMA_BASE_URL: env.OLLAMA_BASE_URL || null,
      PORT: env.PORT || '3001',
      NODE_ENV: env.NODE_ENV || null,
      DATABASE_URL: env.DATABASE_URL ? maskSecret('DATABASE_URL', env.DATABASE_URL) : null,
      JWT_SECRET: env.JWT_SECRET ? maskSecret('JWT_SECRET', env.JWT_SECRET) : null,
    },
    envRawKeys: Object.keys(env),
    services: {
      ollama: { ok: ollamaTags.ok, ms: ollamaTags.ms, error: ollamaTags.error, models },
      backend: { ok: backendHealth.ok, ms: backendHealth.ms, status: backendHealth.status, health, error: backendHealth.error },
      frontend: { ok: frontendLogin.ok, ms: frontendLogin.ms, status: frontendLogin.status, error: frontendLogin.error },
    },
    models: { expectedChat, expectedEmbed, hasChat, hasEmbed, list: models },
    containers,
  };
}

function nextActions(report) {
  const steps = [];
  if (!report.files.backendModules) steps.push('cd backend; npm install');
  if (!report.files.frontendModules) steps.push('cd frontend; npm install');
  if (!report.files.backendEnv) steps.push('npm run setup:envs   (tạo file .env)');
  if (!report.dockerOk) steps.push('Mở Docker Desktop, đợi icon xanh, rồi npm run setup:ai');
  else if (!report.services.ollama.ok) steps.push('npm run dev:ollama   (kéo model lần đầu ~2GB)');
  else if (!report.models.hasChat || !report.models.hasEmbed) steps.push('npm run dev:ollama   (thiếu model chat/embed)');
  else if (!report.services.backend.ok) {
    steps.push('npm run dev:backend   (API chưa chạy — đúng nếu vừa setup xong)');
    steps.push('npm run dev:frontend  (terminal 2)');
  } else if (!report.services.frontend.ok) {
    steps.push('npm run dev:frontend');
  } else {
    steps.push('Mở http://localhost:3000  ·  demo@healthguard.vn / Demo@123');
  }
  if (report.env.AI_PROVIDER && ['gemini', 'openai'].includes(report.env.AI_PROVIDER)) {
    steps.unshift('npm run setup:envs   (đổi AI_PROVIDER cũ → ollama)');
  }
  return steps;
}

function printDoctor(report) {
  banner('HealthGuard  ·  doctor', `${nowStamp()}  ·  CLI ${VERSION}  ·  Node ${report.node}`);
  console.log(color.dim('  Nguồn sự thật: file .env, Docker, Ollama /api/tags, GET /api/health'));

  section('Máy & mã nguồn');
  row(true, 'Node.js', report.node);
  row(Boolean(report.npm), 'npm', report.npm || 'không thấy');
  row(report.files.backendModules, 'backend/node_modules', report.files.backendModules ? 'đã cài' : 'THIẾU — npm install');
  row(report.files.frontendModules, 'frontend/node_modules', report.files.frontendModules ? 'đã cài' : 'THIẾU — npm install');
  row(report.files.backendEnv, 'backend/.env', report.files.backendEnv ? 'có' : 'THIẾU');
  row(report.files.frontendEnv, 'frontend/.env.local', report.files.frontendEnv ? 'có' : 'THIẾU');
  row(report.files.desktopEnv, 'desktop/.env', report.files.desktopEnv ? 'có' : 'chưa (tùy chọn)');

  section('Cấu hình AI (backend/.env — secret đã che)');
  row(Boolean(report.env.AI_PROVIDER), 'AI_PROVIDER', report.env.AI_PROVIDER || 'THIẾU');
  row(Boolean(report.env.OLLAMA_MODEL), 'OLLAMA_MODEL', report.env.OLLAMA_MODEL || 'THIẾU');
  row(Boolean(report.env.OLLAMA_EMBED_MODEL), 'OLLAMA_EMBED', report.env.OLLAMA_EMBED_MODEL || 'THIẾU');
  row(Boolean(report.env.OLLAMA_BASE_URL), 'OLLAMA_BASE_URL', report.env.OLLAMA_BASE_URL || 'THIẾU');
  row(Boolean(report.env.DATABASE_URL), 'DATABASE_URL', report.env.DATABASE_URL || 'THIẾU');
  row(Boolean(report.env.JWT_SECRET), 'JWT_SECRET', report.env.JWT_SECRET || 'THIẾU');
  kv('NODE_ENV / PORT', `${report.env.NODE_ENV || '—'}  ·  ${report.env.PORT}`);
  if (['gemini', 'openai'].includes(report.env.AI_PROVIDER || '')) {
    console.log(color.yellow('  ⚠  Provider cũ — chạy npm run setup:envs để chuyển sang ollama'));
  }

  section('Hạ tầng');
  row(report.dockerOk, 'Docker Engine', report.dockerOk ? `v${report.dockerVersion}` : 'DOWN — mở Docker Desktop');
  row(report.ollamaCli, 'Ollama CLI native', report.ollamaCli ? 'có (tùy chọn)' : 'không bắt buộc nếu dùng Docker');

  if (report.containers.length) {
    section('Container (docker compose · backend/)');
    table(
      ['Tên', 'Trạng thái', 'Cổng'],
      report.containers.map((c) => [
        c.service || c.name || '—',
        c.health || c.state || '—',
        c.ports || '—',
      ]),
    );
  }

  section('Dịch vụ live');
  const o = report.services.ollama;
  const b = report.services.backend;
  const f = report.services.frontend;
  row(o.ok, 'Ollama :11434', o.ok ? `OK  ${o.ms}ms` : `DOWN${o.error ? ` (${o.error})` : ''}`, o.ok ? '' : 'đúng nếu chưa npm run dev:ollama');
  row(b.ok, 'API     :3001', b.ok ? `HTTP ${b.status}  ${b.ms}ms` : `DOWN${b.error ? ` (${b.error})` : ''}`, b.ok ? '' : 'đúng nếu chưa npm run dev:backend');
  row(f.ok, 'Web     :3000', f.ok ? `HTTP ${f.status}  ${f.ms}ms` : `DOWN${f.error ? ` (${f.error})` : ''}`, f.ok ? '' : 'đúng nếu chưa npm run dev:frontend');

  section('Model Ollama');
  if (!o.ok) {
    console.log(color.dim('  Không gọi được /api/tags — container/CLI Ollama chưa sẵn sàng.'));
  } else if (!report.models.list.length) {
    console.log(color.yellow('  Ollama lên nhưng chưa có model. Chạy: npm run dev:ollama'));
  } else {
    table(
      ['Model', 'Kích thước', 'Cập nhật', 'Vai trò'],
      report.models.list.map((m) => {
        const name = m.name || m.model || '—';
        let role = '';
        if (name.includes(report.models.expectedChat.split(':')[0])) role = 'chat';
        if (name.includes(report.models.expectedEmbed.split(':')[0])) role = role ? `${role}+embed` : 'embed';
        const modified = m.modified_at ? new Date(m.modified_at).toLocaleString('vi-VN') : '—';
        return [name, fmtBytes(m.size), modified, role || 'khác'];
      }),
    );
    row(report.models.hasChat, 'Chat cần có', report.models.expectedChat, report.models.hasChat ? 'khớp' : 'THIẾU');
    row(report.models.hasEmbed, 'Embed cần có', report.models.expectedEmbed, report.models.hasEmbed ? 'khớp' : 'THIẾU');
  }

  if (b.health) {
    section('Phản hồi GET /api/health (backend đang chạy)');
    const h = b.health;
    row(h.status === 'ok', 'status', `${h.status}  ${badge(h.status)}`);
    row(h.database === 'ok', 'database', h.database);
    kv('uptime', fmtUptime(h.uptime));
    kv('timestamp', h.timestamp || '—');
    if (h.ai) {
      row(h.ai.ollama === 'ok' || h.ai.ollama === 'skipped', 'ai.provider', h.ai.provider);
      kv('ai.model', h.ai.model);
      if (h.ai.embedModel) kv('ai.embed', h.ai.embedModel);
      row(
        h.ai.ollama === 'ok',
        'ai.ollama',
        h.ai.ollama,
        h.ai.ollama === 'down' ? 'API vẫn chạy — AI fallback mock' : '',
      );
    }
    if (h.runtime) {
      kv('runtime.node', h.runtime.node);
      kv('runtime.env', `${h.runtime.env || '—'}  port ${h.runtime.port || '—'}`);
    }
    console.log(color.dim('  JSON đầy đủ:'));
    jsonBlock(h);
  }

  const steps = nextActions(report);
  nextSteps(steps);
  urls([
    ['Web', 'http://localhost:3000'],
    ['API', 'http://localhost:3001/api'],
    ['Swagger', 'http://localhost:3001/api/docs'],
    ['Health', 'http://localhost:3001/api/health'],
    ['Ollama', 'http://localhost:11434'],
  ]);
  console.log('');
  console.log(color.dim('  npm run hg -- help     ·  npm run doctor -- --json'));
  console.log('');
}

function printStatus(report) {
  banner('HealthGuard  ·  status', nowStamp());
  const o = report.services.ollama;
  const b = report.services.backend;
  const f = report.services.frontend;
  table(
    ['Dịch vụ', 'Cổng', 'Trạng thái', 'Độ trễ', 'Chi tiết'],
    [
      ['Ollama', '11434', o.ok ? 'UP' : 'DOWN', o.ok ? `${o.ms}ms` : '—', `${report.models.list.length} model`],
      ['API', '3001', b.ok ? 'UP' : 'DOWN', b.ok ? `${b.ms}ms` : '—', b.health?.status || b.error || ''],
      ['Web', '3000', f.ok ? 'UP' : 'DOWN', f.ok ? `${f.ms}ms` : '—', f.status ? `HTTP ${f.status}` : f.error || ''],
      ['Docker', '—', report.dockerOk ? 'UP' : 'DOWN', '—', report.dockerVersion ? `v${report.dockerVersion}` : ''],
    ],
  );
  if (b.health) {
    section('Health backend');
    jsonBlock(b.health);
  }
  console.log('');
}

function printEnv(report) {
  banner('HealthGuard  ·  env', 'Giá trị đã che secret — không in mật khẩu');
  section('backend/.env');
  for (const [k, v] of Object.entries(report.env)) {
    kv(k, v ?? color.red('THIẾU'));
  }
  kv('Số khóa trong file', String(report.envRawKeys.length));
  console.log('');
}

function printHelp() {
  banner('HealthGuard CLI', `v${VERSION}  ·  npm run hg -- <lệnh>`);
  console.log('');
  table(
    ['Lệnh', 'npm run', 'Việc làm'],
    [
      ['help', 'hg', 'Danh sách lệnh (mặc định)'],
      ['doctor', 'doctor', 'Chẩn đoán đầy đủ: env, Docker, model, API'],
      ['status', 'status', 'Bảng live 3 dịch vụ + JSON health'],
      ['env', 'env', 'In cấu hình .env (đã che secret)'],
      ['urls', 'urls', 'Địa chỉ web / API / Swagger'],
    ],
  );
  section('Dev hàng ngày');
  kv('setup lần đầu', 'npm run setup:ai');
  kv('API', 'npm run dev:backend');
  kv('Web', 'npm run dev:frontend');
  kv('App PC', 'npm run dev:desktop');
  urls([
    ['Web', 'http://localhost:3000'],
    ['API', 'http://localhost:3001/api'],
    ['Swagger', 'http://localhost:3001/api/docs'],
  ]);
  console.log('');
  console.log(color.dim('  Demo: demo@healthguard.vn / Demo@123'));
  console.log(color.dim('  JSON: npm run doctor -- --json'));
  console.log('');
}

function printUrls() {
  banner('HealthGuard  ·  urls', nowStamp());
  urls([
    ['Web', 'http://localhost:3000'],
    ['Đăng nhập', 'http://localhost:3000/login'],
    ['API', 'http://localhost:3001/api'],
    ['Swagger', 'http://localhost:3001/api/docs'],
    ['Health', 'http://localhost:3001/api/health'],
    ['Ollama tags', 'http://localhost:11434/api/tags'],
  ]);
  kv('Tài khoản demo', 'demo@healthguard.vn / Demo@123');
  console.log('');
}

async function main() {
  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    printHelp();
    return;
  }
  if (cmd === 'urls') {
    printUrls();
    return;
  }

  const report = await collect();

  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  if (cmd === 'doctor') printDoctor(report);
  else if (cmd === 'status') printStatus(report);
  else if (cmd === 'env') printEnv(report);
  else {
    console.log(color.red(`  Lệnh không rõ: ${cmd}`));
    printHelp();
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
