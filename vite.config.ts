import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const apiTarget = process.env.DUYEN_CA_API ?? 'http://127.0.0.1:8788';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
  preview: {
    host: true,
    port: 5174,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
});
