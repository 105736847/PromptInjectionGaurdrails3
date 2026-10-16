// vite.config.js – optional: let the Vite dev server forward API calls.
// The browser then talks to ONE origin (http://localhost:3000), so you don't
// need CORS during development. Call fetch('/api/predict') in your code.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // /api/predict  →  http://localhost:8000/predict
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
