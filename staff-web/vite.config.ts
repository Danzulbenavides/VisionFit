import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Staff site runs on its own port so it can run next to admin-web (5173)
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, strictPort: true },
})
