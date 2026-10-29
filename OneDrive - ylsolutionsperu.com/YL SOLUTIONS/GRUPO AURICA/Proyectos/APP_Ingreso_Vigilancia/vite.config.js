import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Registro Ingreso',
        short_name: 'Registro Ingreso',
        description: 'Aplicación de Registro y Vigilancia Grupo Aurica',
        theme_color: '#245187',
        background_color: '#f0f2f5',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Incluye .mjs para precachear el worker de pdf.js (visor de actas).
        // Por defecto workbox solo cachea js/css/html/ico/png/svg/woff2.
        globPatterns: ['**/*.{js,mjs,css,html,ico,png,svg,woff2}'],
        // exceljs (~930 KB) solo se usa al exportar en PC: no tiene sentido
        // precachearlo en las tablets de las garitas. Se cachea al usarlo.
        globIgnores: ['**/exceljs.min-*.js'],
        // El worker de pdf.js pesa ~1,3 MB; el limite por defecto (2 MiB)
        // lo deja fuera sin avisar si algun dia crece.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // exceljs: se descarga la primera vez que se exporta y queda cacheado
            urlPattern: /\/assets\/exceljs\.min-.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'aurica-exceljs',
              expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 * 90 }
            }
          }
        ]
      }
    })
  ]
});
