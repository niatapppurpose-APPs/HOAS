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
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger', 'console.info', 'console.warn', 'console.error']
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - keep dependencies together to avoid initialization order issues
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')){
            return 'react-vendor';
          }
          if (id.includes('node_modules/firebase')){
            return 'firebase-vendor';
          }
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')){
            return 'leaflet-vendor';
          }
          if (id.includes('node_modules/@react-google-maps')){
            return 'google-maps-vendor';
          }
          // Keep recharts with other charting dependencies
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')){
            return 'charts-vendor';
          }
          // Heavy pages - split into separate chunks
          if (id.includes('Analytics')){
            return 'analytics-page';
          }
          if (id.includes('Pages/Reports')){
            return 'reports-page';
          }
          if (id.includes('EmergencyLocation')){
            return 'emergency-location';
          }
          // Dashboard layout chunks ONLY (not the routes/pages inside)
          if (id.includes('Pages/OwnersDashboard')){
            return 'owner-dashboard';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    target: 'es2020',
    // Reduce initial chunk size with more aggressive splitting
    splitVendorChunkPlugin: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore']
  }
})


