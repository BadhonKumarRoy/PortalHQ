// vite.config.js
// Configures the Vite development server for PortalHQ.
// Sets up the React plugin and proxies /api calls to the Django backend.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Any request starting with /api is forwarded to the Django backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
