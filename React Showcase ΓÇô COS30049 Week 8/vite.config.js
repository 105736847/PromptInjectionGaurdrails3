import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // same port Create React App used, so `npm start` feels familiar
    proxy: {
      // Any request to /api/... is forwarded to the FastAPI back end on port 8000.
      // The browser only ever talks to localhost:3000, so no CORS problems in development.
      // ws: true also forwards WebSocket connections (used on the "Real-time" page).
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true, ws: true },
    },
  },
  build: {
    // The Material UI page is ~540 kB because MUI is a large library. It is
    // lazy-loaded (see App.jsx), so only visitors of /mui ever download it.
    chunkSizeWarningLimit: 600,
  },
});
