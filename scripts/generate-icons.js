import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Emergency icon SVG: red background with white Star-of-Life-inspired symbol
const svgIcon = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" ry="96" fill="url(#bg)"/>
  <!-- Star of Life arms -->
  <g fill="#ffffff" transform="translate(256,256)">
    <rect x="-18" y="-140" width="36" height="280" rx="18"/>
    <rect x="-18" y="-140" width="36" height="280" rx="18" transform="rotate(60)"/>
    <rect x="-18" y="-140" width="36" height="280" rx="18" transform="rotate(120)"/>
  </g>
  <!-- Center rod -->
  <rect x="236" y="140" width="40" height="232" rx="20" fill="#ffffff"/>
  <!-- Snake curve suggestion -->
  <path d="M256 180 Q286 210 256 240 Q226 270 256 300" stroke="#dc2626" stroke-width="18" fill="none" stroke-linecap="round"/>
</svg>`;

async function generate() {
  const sizes = [192, 512];
  for (const size of sizes) {
    const svgBuffer = Buffer.from(svgIcon(size));
    const outputPath = join(publicDir, `icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${outputPath}`);
  }
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});

