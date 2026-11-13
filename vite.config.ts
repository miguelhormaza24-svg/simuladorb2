import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// `base` debe coincidir con el nombre del repositorio en GitHub Pages.
export default defineConfig({
  base: '/simuladorb2/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**/*.ts'],
      exclude: ['src/engine/**/*.test.ts', 'src/engine/tipos.ts'],
      reporter: ['text-summary', 'json-summary'],
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 80 },
    },
  },
});
