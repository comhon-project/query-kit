import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from './vite.shared.js';

// Library build only. Rooted at the package directory: the entry is `index.ts`
// and the output is `dist/`, both siblings of this file. The playground (dev
// server and its static build) lives entirely in vite.playground.config.js.
const distDir = fileURLToPath(new URL('./dist', import.meta.url));

export default defineConfig({
  plugins: [
    vue(),
    dts({
      root: fileURLToPath(new URL('.', import.meta.url)),
      tsconfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
      outDirs: [distDir, { dir: distDir, moduleFormat: 'cjs' }],
      entryRoot: fileURLToPath(new URL('.', import.meta.url)),
      include: ['index.ts', 'src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/__tests__/**'],
      bundleTypes: true,
    }),
  ],
  resolve,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: fileURLToPath(new URL('./index.ts', import.meta.url)),
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vue', 'luxon'],
    },
  },
});
