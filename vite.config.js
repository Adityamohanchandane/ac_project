import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        manualChunks: undefined
      }
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096
  },
  server: {
    host: true,
    port: 5177,
    strictPort: true,
    allowedHosts: [
      'ac-project-g7c0.onrender.com',
      'localhost',
      '127.0.0.1',
      '.onrender.com'
    ]
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: [
      'ac-project-g7c0.onrender.com',
      'localhost',
      '127.0.0.1',
      '.onrender.com'
    ]
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})
