/**
 * Terminal helpers — no extra deps. UTF-8 box drawing + ANSI colors.
 */
const isTTY = Boolean(process.stdout.isTTY);
const noColor = Boolean(process.env.NO_COLOR) || !isTTY;

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgTeal: '\x1b[48;5;30m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

export function paint(code, text) {
  if (noColor) return String(text);
  return `${code}${text}${C.reset}`;
}

export const color = {
  dim: (t) => paint(C.dim, t),
  bold: (t) => paint(C.bold, t),
  red: (t) => paint(C.red, t),
  green: (t) => paint(C.green, t),
  yellow: (t) => paint(C.yellow, t),
  cyan: (t) => paint(C.cyan, t),
  blue: (t) => paint(C.blue, t),
  magenta: (t) => paint(C.magenta, t),
};

export function badge(status) {
  const s = String(status || '').toLowerCase();
  const ok = ['ok', 'up', 'ready', 'healthy', 'running', 'có', 'installed'].includes(s);
  const warn = ['down', 'degraded', 'no_model', 'wait', 'skipped'].includes(s);
  const bad = ['error', 'missing', 'fail', 'failed'].includes(s);
  const label = ` ${String(status).toUpperCase()} `;
  if (noColor) return `[${String(status).toUpperCase()}]`;
  if (ok) return paint(C.bgGreen + C.bold, label);
  if (bad) return paint(C.bgRed + C.bold + C.white, label);
  if (warn) return paint(C.bgYellow + C.bold, label);
  return paint(C.cyan, `[${String(status).toUpperCase()}]`);
}

export function banner(title, subtitle) {
  const width = 62;
  const line = '─'.repeat(width - 2);
  const pad = (s) => {
    const str = String(s);
    const rest = Math.max(0, width - 4 - str.length);
    return `│  ${str}${' '.repeat(rest)}│`;
  };
  const out = [
    color.cyan(`┌${line}┐`),
    color.cyan('│') + color.bold(color.cyan(`  ${title}`.padEnd(width - 2))) + color.cyan('│'),
    subtitle ? color.cyan(pad(subtitle)) : null,
    color.cyan(`└${line}┘`),
  ].filter(Boolean);
  console.log(out.join('\n'));
}

export function section(title) {
  console.log('');
  console.log(color.bold(color.cyan(`▸ ${title}`)));
}

export function kv(label, value, extra = '') {
  const l = String(label).padEnd(22);
  console.log(`  ${color.dim(l)} ${value}${extra ? color.dim(`  ${extra}`) : ''}`);
}

export function row(ok, label, value, note = '') {
  const mark = ok === true ? color.green('●') : ok === false ? color.red('●') : color.yellow('●');
  const l = String(label).padEnd(22);
  const n = note ? color.dim(`  ${note}`) : '';
  console.log(`  ${mark} ${l} ${value}${n}`);
}

export function table(headers, rows) {
  const cols = headers.map((h, i) =>
    Math.max(String(h).length, ...rows.map((r) => String(r[i] ?? '').length)),
  );
  const sep = cols.map((w) => '─'.repeat(w + 2)).join('┼');
  const fmt = (cells) =>
    cells.map((c, i) => ` ${String(c ?? '').padEnd(cols[i])} `).join('│');
  console.log(color.dim(`  ┌${cols.map((w) => '─'.repeat(w + 2)).join('┬')}┐`));
  console.log(`  │${fmt(headers)}│`);
  console.log(color.dim(`  ├${sep}┤`));
  for (const r of rows) {
    console.log(`  │${fmt(r)}│`);
  }
  console.log(color.dim(`  └${cols.map((w) => '─'.repeat(w + 2)).join('┴')}┘`));
}

export function nextSteps(lines) {
  section('Việc cần làm');
  lines.forEach((line, i) => {
    console.log(`  ${color.yellow(`${i + 1}.`)} ${line}`);
  });
}

export function urls(items) {
  section('Địa chỉ');
  for (const [name, url] of items) {
    kv(name, color.cyan(url));
  }
}

export function jsonBlock(obj) {
  const pretty = JSON.stringify(obj, null, 2);
  for (const line of pretty.split('\n')) {
    console.log(color.dim(`  ${line}`));
  }
}

export function hr() {
  console.log(color.dim(`  ${'─'.repeat(58)}`));
}

export { C, isTTY, noColor };
