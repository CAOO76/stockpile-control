import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'stockpile-control-plugin',
      filename: 'remoteEntry.js',
      exposes: {
        './Plugin': './src/plugin.ts',
        './App': './src/App.tsx',
      },
      shared: ['react', 'react-dom'],
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
        // Asegurar nombres de archivos predecibles para SRI
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
})
