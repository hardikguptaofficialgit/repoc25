import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const ORANGE = { r: 211, g: 74, b: 9, a: 255 };
const WHITE = { r: 255, g: 255, b: 255, a: 255 };
const SHADOW = { r: 255, g: 255, b: 255, a: 90 };

function setPixel(data, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const idx = (size * y + x) << 2;
  data[idx] = color.r;
  data[idx + 1] = color.g;
  data[idx + 2] = color.b;
  data[idx + 3] = color.a;
}

function fillRoundedRect(data, size, x0, y0, width, height, radius, color) {
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const rx = x - x0;
      const ry = y - y0;
      if (rx < 0 || ry < 0 || rx >= width || ry >= height) continue;

      const cornerX = rx < radius ? radius - rx : rx > width - radius - 1 ? rx - (width - radius - 1) : 0;
      const cornerY = ry < radius ? radius - ry : ry > height - radius - 1 ? ry - (height - radius - 1) : 0;
      if (cornerX * cornerX + cornerY * cornerY > radius * radius) continue;

      setPixel(data, size, x, y, color);
    }
  }
}

function fillCircle(data, size, cx, cy, radius, color) {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        setPixel(data, size, x, y, color);
      }
    }
  }
}

function drawMapPinIcon(size) {
  const png = new PNG({ width: size, height: size });
  const data = png.data;
  const margin = Math.round(size * 0.08);
  const radius = Math.round(size * 0.18);

  fillRoundedRect(data, size, margin, margin, size - margin * 2, size - margin * 2, radius, ORANGE);

  const cx = size * 0.5;
  const headY = size * 0.34;
  const headR = size * 0.11;
  const innerR = size * 0.045;

  fillCircle(data, size, cx, headY, headR, WHITE);
  fillCircle(data, size, cx, headY, innerR, ORANGE);

  const tipY = size * 0.72;
  for (let y = Math.round(headY); y <= Math.round(tipY); y += 1) {
    const progress = (y - headY) / (tipY - headY);
    const halfWidth = headR * (1 - progress * 0.92);
    for (let x = Math.round(cx - halfWidth); x <= Math.round(cx + halfWidth); x += 1) {
      setPixel(data, size, x, y, WHITE);
    }
  }

  const mapY = Math.round(size * 0.78);
  const mapH = Math.max(2, Math.round(size * 0.05));
  fillRoundedRect(data, size, Math.round(size * 0.22), mapY, Math.round(size * 0.56), mapH, Math.max(1, mapH / 2), SHADOW);
  fillRoundedRect(data, size, Math.round(size * 0.28), mapY - Math.round(size * 0.07), Math.round(size * 0.18), Math.max(2, Math.round(size * 0.035)), 2, SHADOW);
  fillRoundedRect(data, size, Math.round(size * 0.54), mapY - Math.round(size * 0.07), Math.round(size * 0.18), Math.max(2, Math.round(size * 0.035)), 2, SHADOW);

  return png;
}

for (const size of sizes) {
  const png = drawMapPinIcon(size);
  const buffer = PNG.sync.write(png);
  writeFileSync(join(publicDir, `icon-${size}.png`), buffer);
  if (size === 512) {
    writeFileSync(join(publicDir, 'source.png'), buffer);
  }
}

console.log(`Generated ${sizes.length} map icons in ${publicDir}`);
