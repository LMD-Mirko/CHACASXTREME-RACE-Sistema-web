import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Backend SOLO en VPS.
 * Por defecto el proxy habla a localhost (levanta `npm run tunnel`).
 * Sin tunnel: VITE_VPS_DIRECT=1 npm run dev → IP pública del VPS.
 */
const useDirectVps = process.env.VITE_VPS_DIRECT === '1'
const API_TARGET = useDirectVps ? 'http://24.199.82.193:8888' : 'http://127.0.0.1:8888'
const WS_TARGET = useDirectVps ? 'http://24.199.82.193:8080' : 'http://127.0.0.1:8080'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Chacas Xtreme Race',
        short_name: 'ChacasXtreme',
        description: 'Sistema de Cronometraje y Largada - Chacas Xtreme Race 4',
        theme_color: '#ff5e00',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
      },
      '/broadcasting': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
      },
      '/app': {
        target: WS_TARGET,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/apps': {
        target: WS_TARGET,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
