import fs from 'fs';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Un ícono sutil y elegante de ingreso.
// Fondo blanco con esquinas redondeadas (ovaladas), ícono de flecha/puerta en azul #345D9D.
const svgContent = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Fondo blanco con esquinas ovaladas -->
  <rect x="20" y="20" width="472" height="472" rx="100" ry="100" fill="#ffffff" />
  
  <!-- Icono de ingreso elegante y sutil en el centro, color azul #345D9D -->
  <!-- Escalado a buen tamao para que se vea claro pero con padding respirable -->
  <g transform="translate(128, 128) scale(1)" fill="#345D9D" stroke="#345D9D" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    <path d="M141.66,133.66l-40,40a8,8,0,0,1-11.32-11.32L116.69,136H24a8,8,0,0,1,0-16H116.69L90.34,93.66a8,8,0,0,1,11.32-11.32l40,40A8,8,0,0,1,141.66,133.66ZM200,40H136a8,8,0,0,0,0,16h56V200H136a8,8,0,0,0,0,16h64a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Z" />
  </g>
</svg>
`;

async function generatePerfectIcons() {
  const svgBuffer = Buffer.from(svgContent.trim());

  // Convertir SVG a PNG de 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, 'public', 'pwa-512x512.png'));

  // Convertir SVG a PNG de 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(__dirname, 'public', 'pwa-192x192.png'));

  console.log('Iconos perfectos generados desde SVG puro.');
}

generatePerfectIcons().catch(console.error);
