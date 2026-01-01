import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const SOURCE_ICON = path.join(PUBLIC_DIR, 'icon-source.png');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function resizeIcon(size) {
  const outputPath = path.join(PUBLIC_DIR, `icon-${size}.png`);
  
  await sharp(SOURCE_ICON)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(outputPath);
  
  return outputPath;
}

async function main() {
  // Check if source icon exists
  try {
    await fs.access(SOURCE_ICON);
  } catch (err) {
    console.error(`[icons] Source icon not found: ${SOURCE_ICON}`);
    console.error('[icons] Please ensure icon-source.png exists in the public directory');
    process.exitCode = 1;
    return;
  }

  console.log(`[icons] Resizing icon from ${SOURCE_ICON}...`);
  
  for (const size of SIZES) {
    await resizeIcon(size);
    console.log(`[icons] Generated icon-${size}.png`);
  }

  console.log(`[icons] Successfully generated ${SIZES.length} icons in ${PUBLIC_DIR}`);
}

main().catch((err) => {
  console.error('[icons] Failed to generate icons:', err);
  process.exitCode = 1;
});
