import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react() // Let Vite handle React transformations automatically
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path,
        configure: (proxy) => {
          proxy.on('error', (err) => {
          });
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['Cache-Control'] = 'no-store';
          });
        },
      }
    },
    hmr: {
      overlay: false
    }
  }
});
