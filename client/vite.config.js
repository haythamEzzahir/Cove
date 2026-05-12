import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    preprocessorOptions: {
      tailwindcss: {
        config: {
          darkMode: 'class',
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/coins': { target: 'http://localhost:5000', changeOrigin: true },
      '/chart': { target: 'http://localhost:5000', changeOrigin: true },
      '/search': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
})