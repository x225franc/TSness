import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 3000
  },
    define: {
    'window.config.FRONTEND_URL': JSON.stringify('http://localhost:3000'),
    'window.config.BACKEND_URL': JSON.stringify('http://localhost:3005'),
    // 'window.config.FRONTEND_URL': JSON.stringify('http://tsness.com'),
    // 'window.config.BACKEND_URL': JSON.stringify('http://backend.tsness.com'),
  }
})
