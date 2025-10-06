import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    host: true,
    hmr: {
      clientPort: 8443,
      protocol: 'wss'
    },
    proxy: {
      '/api': {
        target: 'http://backend:3001',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://backend:3001',
        changeOrigin: true,
        ws: true
      },
      '/ws': {
        target: 'http://backend:3001',
        changeOrigin: true,
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020'
  },
  resolve: {
    alias: {
      '@': '/src',
      '@/components': '/src/components',
      '@/pages': '/src/pages',
      '@/services': '/src/services',
      '@/utils': '/src/utils',
      '@/store': '/src/store',
      '@/styles': '/src/styles'
    }
  },
  css: {
    postcss: './postcss.config.js'
  }
})
