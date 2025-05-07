import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy) => {
          proxy.on('error', (err, _req, _res) => {
            console.warn('Proxy error:', err);
          });
          proxy.on('proxyRes', function (proxyRes) {
            proxyRes.headers['Cache-Control'] = 'no-store';
          });
        },
      }
    }
  }
})