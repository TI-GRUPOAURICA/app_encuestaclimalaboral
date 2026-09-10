import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// ─────────────────────────────────────────────────────────────────────────────
// Configuración de Vite para IT/BI Planner Pro
//  - @tailwindcss/vite: compila Tailwind CSS v4 sin PostCSS extra.
//  - base '/': rutas absolutas, ideal para Cloudflare Pages.
//  - build.outDir 'dist': es la carpeta que Cloudflare Pages publica.
// ─────────────────────────────────────────────────────────────────────────────
export default defineConfig({
  plugins: [tailwindcss()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
