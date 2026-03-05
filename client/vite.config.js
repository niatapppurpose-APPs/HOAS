import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
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
    // Use esbuild (built-in, no extra install) instead of terser
    minify: 'esbuild',
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - these rarely change, so they cache well
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          ui: ['lucide-react', 'react-spinners']
        }
      }
    },
    // Increase chunk size warning limit (reduces warnings)
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging (optional, set to false for smaller builds)
    sourcemap: false,
    // Target modern browsers for smaller bundle
    target: 'es2020'
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore']
  }
})


