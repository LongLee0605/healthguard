import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const sharpPath = path.join(root, 'frontend', 'node_modules', 'sharp');
let sharp;
try {
  sharp = require(sharpPath);
} catch {
  console.error('Không tìm thấy sharp. Chạy: cd frontend && npm install');
  process.exit(1);
}

const brandDir = path.join(root, 'brand');
const iconSvg = fs.readFileSync(path.join(brandDir, 'icon.svg'));
const publicDir = path.join(root, 'frontend', 'public');
const desktopDir = path.join(root, 'desktop', 'assets');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function writePng(dest, size) {
  ensureDir(path.dirname(dest));
  await sharp(iconSvg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(dest);
  console.log(`Created ${path.relative(root, dest)} (${size}x${size})`);
}

function pngToIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6 + 16 * count;
  let offset = headerSize;
  const entries = pngBuffers.map((buf) => {
    const width = buf.readUInt32BE(16);
    const entry = { buf, width, offset, bytes: buf.length };
    offset += buf.length;
    return entry;
  });

  const out = Buffer.alloc(offset);
  out.writeUInt16LE(0, 0);
  out.writeUInt16LE(1, 2);
  out.writeUInt16LE(count, 4);

  entries.forEach((entry, i) => {
    const pos = 6 + i * 16;
    out.writeUInt8(entry.width >= 256 ? 0 : entry.width, pos);
    out.writeUInt8(entry.width >= 256 ? 0 : entry.width, pos + 1);
    out.writeUInt8(0, pos + 2);
    out.writeUInt8(0, pos + 3);
    out.writeUInt16LE(1, pos + 4);
    out.writeUInt16LE(32, pos + 6);
    out.writeUInt32LE(entry.bytes, pos + 8);
    out.writeUInt32LE(entry.offset, pos + 12);
    entry.buf.copy(out, entry.offset);
  });
  return out;
}

async function pngBuffer(size) {
  return sharp(iconSvg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function main() {
  ensureDir(publicDir);
  ensureDir(desktopDir);

  for (const name of ['icon.svg', 'logo.svg', 'logo-dark.svg']) {
    fs.copyFileSync(path.join(brandDir, name), path.join(publicDir, name));
  }
  fs.copyFileSync(path.join(brandDir, 'icon.svg'), path.join(desktopDir, 'icon.svg'));

  await writePng(path.join(publicDir, 'icon.png'), 512);
  await writePng(path.join(publicDir, 'icon-192.png'), 192);
  await writePng(path.join(publicDir, 'icon-512.png'), 512);
  await writePng(path.join(publicDir, 'apple-touch-icon.png'), 180);

  await writePng(path.join(desktopDir, 'icon.png'), 256);

  const ico = pngToIco(await Promise.all([16, 32, 48, 256].map(pngBuffer)));
  const icoPublic = path.join(publicDir, 'favicon.ico');
  const icoDesktop = path.join(desktopDir, 'icon.ico');
  fs.writeFileSync(icoPublic, ico);
  fs.writeFileSync(icoDesktop, ico);
  console.log('Created favicon.ico / desktop icon.ico');
  console.log('Brand assets generated from brand/icon.svg');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
