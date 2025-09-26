// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Only define global if you truly need it; otherwise remove.
  define: {
     global: 'globalThis',
  },
  server: {
    host: true,
    port: 5173,
   proxy: {
    '/api': { target: 'http://127.0.0.1:3000', changeOrigin: true },
    '/socket.io': { target: 'http://127.0.0.1:3000', ws: true, changeOrigin: true },
  },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      reportsDirectory: './coverage',
    },
  },
  build: {
    target: 'esnext',
    // If you reference Node globals in the client bundle, keep it falsey.
    // rollupOptions: { ... }
  },
  optimizeDeps: {
    // Keep empty unless you actually import node polyfills in the client.
    // include: ['buffer', 'process'],
  },
})
