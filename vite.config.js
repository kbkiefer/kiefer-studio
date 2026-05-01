import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.',
  publicDir: 'assets',
  build: { outDir: 'dist' },
  server: { port: 3001 },
  plugins: [react()],
});
