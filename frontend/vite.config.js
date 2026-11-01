import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Browser calls /api/x, Vite forwards it to the backend as /x
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': { target: 'http://127.0.0.1:8000', rewrite: (p) => p.replace(/^\/api/, '') } } },
})