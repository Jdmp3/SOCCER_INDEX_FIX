import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo el frontend corre en el 5173 y el backend Go en el 8080.
    // Este proxy hace que el navegador pida /api/noticias al mismo origen, asi
    // que nunca nos topamos con el CORS.
    // En produccion este proxy no aplica: ahi /api lo sirve el backend Go.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})