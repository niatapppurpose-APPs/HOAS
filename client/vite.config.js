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
      '.localhost.run'
    ]
  }
})
