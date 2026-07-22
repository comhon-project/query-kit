import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

const distDir = fileURLToPath(new URL('./dist', import.meta.url));

// https://vitejs.dev/config/
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
  root: './playground',
  resolve: {
    conditions: ['source'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@i18n': fileURLToPath(new URL('./src/i18n', import.meta.url)),
      '@config': fileURLToPath(new URL('./src/config', import.meta.url)),
      '@tests': fileURLToPath(new URL('./src/__tests__', import.meta.url)),
    },
  },
  build: {
    outDir: '../dist',
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
