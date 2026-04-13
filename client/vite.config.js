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
          // Vendor chunks
          if (id.includes('node_modules/react')){
            return 'react-vendor';
          }
          if (id.includes('node_modules/firebase')){
            return 'firebase-vendor';
          }
          if (id.includes('node_modules/leaflet')){
            return 'leaflet-vendor';
          }
          if (id.includes('node_modules/recharts')){
            return 'charts-vendor';
          }
          if (id.includes('node_modules/@react-google-maps')){
            return 'google-maps-vendor';
          }
          // Heavy pages - split into separate chunks
          if (id.includes('Analytics/AnalyticsDashboard')){
            return 'analytics-page';
          }
          if (id.includes('Pages/Reports')){
            return 'reports-page';
          }
          if (id.includes('EmergencyLocation')){
            return 'emergency-location';
          }
          // UI/Layout chunks by dashboard
          if (id.includes('DashBoards/Student')){
            return 'student-dashboard';
          }
          if (id.includes('DashBoards/Warden')){
            return 'warden-dashboard';
          }
          if (id.includes('DashBoards/Management')){
            return 'management-dashboard';
          }
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


