import fs from 'fs';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgContent = `
<svg width="512" height="512" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <!-- Fondo redondeado con el color solicitado -->
  <rect width="256" height="256" rx="56" fill="#345D9D"/>
  
  <!-- Ícono de ingreso (Phosphor Sign-In), escalado un poco para que se vea genial -->
  <g transform="scale(1.2) translate(-21, -21)" fill="#ffffff">
    <path d="M141.66,133.66l-40,40a8,8,0,0,1-11.32-11.32L116.69,136H24a8,8,0,0,1,0-16H116.69L90.34,93.66a8,8,0,0,1,11.32-11.32l40,40A8,8,0,0,1,141.66,133.66ZM200,40H136a8,8,0,0,0,0,16h56V200H136a8,8,0,0,0,0,16h64a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Z"/>
  </g>
</svg>
`;

async function generateIcons() {
  const svgPath = path.join(__dirname, 'public', 'pwa-icon.svg');
  fs.writeFileSync(svgPath, svgContent.trim());

  // Convertir SVG a PNG de 512x512
  await sharp(svgPath)
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, 'public', 'pwa-512x512.png'));

  // Convertir SVG a PNG de 192x192
  await sharp(svgPath)
    .resize(192, 192)
    .png()
    .toFile(path.join(__dirname, 'public', 'pwa-192x192.png'));

  console.log('Iconos generados exitosamente con color #345D9D');
}

generateIcons().catch(console.error);
