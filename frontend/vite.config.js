import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  plugins: [vue(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 9527,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../backend/public',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vant: ['vant'],
          vue: ['vue', 'vue-router', 'pinia']
        }
      }
    }
  }
})
