import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts', './test/jest.setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'dist-temp/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/test/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, '../shared'),
    },
  },
  define: {
    'process.env.NODE_ENV': '"test"',
  },
});
