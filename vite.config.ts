import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  plugins: [
    react(),
    federation({
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
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-extra': ['recharts', 'framer-motion', 'three']
        }
      },
    },
  },
})
