import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createElegantIcon() {
  const originalImage = 'C:\\Users\\Leonar\\.gemini\\antigravity-ide\\brain\\4ee44631-4834-4740-8d46-6d872842fb0b\\.user_uploaded\\media_1788131901444.png';
  
  // Create a 512x512 white rounded rectangle SVG
  const bgSvg = Buffer.from(`
    <svg width="512" height="512" viewBox="0 0 512 512">
      <!-- White background with elegant rounded corners -->
      <rect x="0" y="0" width="512" height="512" rx="110" ry="110" fill="#ffffff"/>
    </svg>
  `);

  // Resize the user's original elegant blue arrow to fit inside the 512 box.
  // The box is 512. We'll make the arrow 340px wide to leave nice white padding.
  const arrowBuffer = await sharp(originalImage)
    .resize({ width: 340 })
    .toBuffer();

  // Composite 512x512
  const out512 = path.join(__dirname, 'public', 'pwa-512x512.png');
  await sharp(bgSvg)
    .composite([
      { input: arrowBuffer, gravity: 'center' }
    ])
    .png()
    .toFile(out512);

  // Composite 192x192 (scale down the 512x512)
  const out192 = path.join(__dirname, 'public', 'pwa-192x192.png');
  await sharp(out512)
    .resize(192, 192)
    .png()
    .toFile(out192);

  console.log('Elegance achieved: Icons regenerated perfectly.');
}

createElegantIcon().catch(console.error);
