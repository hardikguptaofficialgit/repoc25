import fs from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Brand/theme color from manifest
const THEME = { r: 0xD3, g: 0x4A, b: 0x09, a: 0xFF };
const WHITE = { r: 0xFF, g: 0xFF, b: 0xFF, a: 0xFF };

function setPixel(png, x, y, { r, g, b, a }) {
  const idx = (png.width * y + x) << 2;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

function fillRect(png, x0, y0, x1, y1, color) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      setPixel(png, x, y, color);
    }
  }
}

function drawIcon(size) {
  const png = new PNG({ width: size, height: size });

  // Background
  fillRect(png, 0, 0, size, size, THEME);

  // Simple high-contrast mark (maskable-safe): a white rounded-ish square + inner orange cut.
  // (No text/fonts needed; keeps the file valid and installable.)
  const pad = Math.round(size * 0.18);
  const outer0 = pad;
  const outer1 = size - pad;

  // Outer white square
  fillRect(png, outer0, outer0, outer1, outer1, WHITE);

  // Inner theme square to create a "frame" look
  const innerPad = Math.round(size * 0.12);
  const inner0 = outer0 + innerPad;
  const inner1 = outer1 - innerPad;
  fillRect(png, inner0, inner0, inner1, inner1, THEME);

  // Small white corner accent for recognizability
  const accent = Math.max(4, Math.round(size * 0.08));
  fillRect(png, inner0, inner0, inner0 + accent, inner0 + accent, WHITE);

  return png;
}

async function writePng(filePath, png) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const buffer = PNG.sync.write(png, { colorType: 6 });
  await fs.writeFile(filePath, buffer);
}

async function main() {
  for (const size of SIZES) {
    const png = drawIcon(size);
    const outPath = path.join(PUBLIC_DIR, `icon-${size}.png`);
    await writePng(outPath, png);
  }

  // Also ensure a reasonable default apple-touch-icon target exists (we use icon-192.png in index.html)
  console.log(`[icons] Generated ${SIZES.length} icons in ${PUBLIC_DIR}`);
}

main().catch((err) => {
  console.error('[icons] Failed to generate icons:', err);
  process.exitCode = 1;
});
