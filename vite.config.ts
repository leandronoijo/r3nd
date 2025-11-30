import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  root: 'src/frontend',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/frontend', import.meta.url))
    }
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: true
  }
});
