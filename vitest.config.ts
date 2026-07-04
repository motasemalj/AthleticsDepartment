import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@react-native-async-storage/async-storage': path.resolve(__dirname, 'test/mocks/asyncStorage.ts'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
