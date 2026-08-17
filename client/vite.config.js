import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
    allowedHosts: [
      'hoas-demo-2026.loca.lt',
      '.loca.lt',
      '.ngrok.io',
      '.localhost.run',
      '.ngrok-free.dev'
    ]
  },
  // Build optimizations for better performance
  build: {
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger', 'console.info', 'console.warn', 'console.error']
    },
    rollupOptions: {
      output: {
        // Only split React and Firebase vendors - let everything else bundle naturally
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')){
            return 'react-vendor';
          }
          if (id.includes('node_modules/firebase')){
            return 'firebase-vendor';
          }
          // EVERYTHING ELSE bundles naturally - recharts, leaflet, charts all stay with pages that use them
        }
      }
    },
    chunkSizeWarningLimit: 2000,
    sourcemap: false,
    target: 'es2020'
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore']
  }
})


