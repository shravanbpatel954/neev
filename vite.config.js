import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  root: 'web',
  base: './',
  plugins: [preact()],
  build: { outDir: '../dist', emptyOutDir: true, target: 'es2022', assetsInlineLimit: 2048 },
  server: { port: 5199, fs: { allow: ['..'] }, proxy: { '/v1': 'http://localhost:4173' } },
});
