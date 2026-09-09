import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processImage() {
  const inputPath = path.join(__dirname, 'public', 'pwa-192x192.png');
  
  // Create 512x512
  await sharp(inputPath)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
    })
    .toFile(path.join(__dirname, 'public', 'pwa-512x512.png'));
    
  // Create 192x192
  await sharp(inputPath)
    .resize(192, 192, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .toFile(path.join(__dirname, 'public', 'pwa-192x192-temp.png'));

  console.log('Images resized successfully');
}

processImage().catch(console.error);
