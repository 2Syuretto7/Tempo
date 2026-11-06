import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// Relative base so the site works at any GitHub Pages path.
export default defineConfig({
  base: './',
  plugins: [preact()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
} as any);
