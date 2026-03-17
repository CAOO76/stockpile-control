import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'
import { VitePWA } from 'vite-plugin-pwa'
import { mockSyncPlugin } from './plugins/vite-mock-sync'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isAndroid = mode === 'android';

  return {
    server: {
      host: '0.0.0.0',
      port: 5190,
      strictPort: true,
    },
    plugins: [
      react(),
      mockSyncPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'StockPile Control',
          short_name: 'StockPile',
          description: 'Sistema de Cubicación de Acopios - MINREPORT',
          theme_color: '#C68346',
          background_color: '#1a1a1a',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // < 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      }),
      // Solo cargar Module Federation si NO es build de Android/Capacitor
      !isAndroid && federation({
        name: 'stockpile-control-plugin',
        filename: 'remoteEntry.js',
        exposes: {
          './Plugin': './src/plugin.ts',
          './App': './src/App.tsx',
        },
        shared: ['react', 'react-dom', 'firebase/app', 'firebase/firestore', 'firebase/storage', '@capacitor/core', 'framer-motion'],
      }),
    ],
    build: {
      modulePreload: false,
      target: 'esnext',
      minify: 'esbuild', // Minificación para producción
      cssCodeSplit: false,
      sourcemap: 'hidden', // Source Maps privados para depuración interna
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name].js`,
          chunkFileNames: `assets/[name].js`,
          assetFileNames: `assets/[name].[ext]`,
          manualChunks: isAndroid ? undefined : {
            'vendor-react': ['react', 'react-dom'],
            'vendor-extra': ['recharts', 'framer-motion', 'three']
          }
        },
      },
    },
  }
})
