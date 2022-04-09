import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  server: {
    // https://github.com/http-party/node-http-proxy#options
    proxy: {
      '^/api': {
        target: 'https://m.api.xxx.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // '^/mockapi': {
      //   target: 'https://m.api.xxx.net',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, ''),
      // },
    },
  },
});
