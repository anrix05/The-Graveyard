import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SVG_STANDARD = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="#0d0d10" />
  <g transform="translate(64, 64) scale(16)" fill="none" stroke="#ff2a2a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 3.85 2.17 7.2 5.37 8.9l.63.33V22h8v-.77l.63-.33C19.83 19.2 22 15.85 22 12c0-5.52-4.48-10-10-10z"/>
    <circle cx="9" cy="12" r="1.5" fill="#ff2a2a"/>
    <circle cx="15" cy="12" r="1.5" fill="#ff2a2a"/>
    <path d="M10 16h4"/>
  </g>
</svg>
`;

const SVG_MASKABLE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#0a0a0b" />
  <g transform="translate(106, 106) scale(12.5)" fill="none" stroke="#ff2a2a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 3.85 2.17 7.2 5.37 8.9l.63.33V22h8v-.77l.63-.33C19.83 19.2 22 15.85 22 12c0-5.52-4.48-10-10-10z"/>
    <circle cx="9" cy="12" r="1.5" fill="#ff2a2a"/>
    <circle cx="15" cy="12" r="1.5" fill="#ff2a2a"/>
    <path d="M10 16h4"/>
  </g>
</svg>
`;

async function main() {
  const publicDir = path.resolve(process.cwd(), 'public');
  const appDir = path.resolve(process.cwd(), 'src/app');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('Generating favicon & PWA icon suite...');

  const standardBuffer = Buffer.from(SVG_STANDARD);
  const maskableBuffer = Buffer.from(SVG_MASKABLE);

  // 1. Apple Touch Icon 180x180
  await sharp(standardBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(appDir, 'apple-icon.png'));
  console.log('✓ src/app/apple-icon.png (180x180)');

  // 2. Icon 192x192
  await sharp(standardBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ public/icon-192.png (192x192)');

  // 3. Icon 512x512
  await sharp(standardBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ public/icon-512.png (512x512)');

  // 4. Icon Maskable 512x512
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));
  console.log('✓ public/icon-maskable-512.png (512x512 maskable)');

  // 5. Favicon 32x32 (Saved as standard ICO/PNG format)
  await sharp(standardBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✓ public/favicon.ico (32x32)');

  console.log('Icon suite generation complete!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
