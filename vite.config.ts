import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const resolveAlias = {
  '@shared': path.resolve(__dirname, 'src/shared'),
  '@utils': path.resolve(__dirname, 'src/shared/utils'),
  '@design': path.resolve(__dirname, 'src/shared/design'),
  src: path.resolve(__dirname, 'src'),
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: resolveAlias,
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          query: ['@tanstack/react-query'],
          zustand: ['zustand'],
        },
      },
    },
  },
});
