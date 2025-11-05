import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const resolveAlias = {
  '@shared': path.resolve(__dirname, 'src/shared'),
  '@utils': path.resolve(__dirname, 'src/shared/utils'),
  '@design': path.resolve(__dirname, 'src/shared/design'),
  src: path.resolve(__dirname, 'src'),
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: resolveAlias,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['tests/frontend/setupTests.ts'],
    css: false,
    include: ['tests/frontend/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/backend/**', 'tests/e2e/**', 'node_modules/**', 'dist/**'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'coverage/frontend',
      include: ['src/frontend/**/*.{ts,tsx}', 'src/shared/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts'],
    },
  },
});
