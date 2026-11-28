import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { lib: { entry: fileURLToPath(new URL('./src/element/index.ts', import.meta.url)), formats: ['es'], fileName: 'mystira-player' }, emptyOutDir: false },
});
