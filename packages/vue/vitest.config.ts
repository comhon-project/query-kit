import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@i18n': fileURLToPath(new URL('./src/i18n', import.meta.url)),
      '@config': fileURLToPath(new URL('./src/config', import.meta.url)),
      '@tests': fileURLToPath(new URL('./src/__tests__', import.meta.url)),
    },
  },
  test: {
    root: './src',
    environment: 'jsdom',
    restoreMocks: true,
    setupFiles: ['./__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: '../coverage',
      include: ['core/**', 'components/**', 'i18n/**', 'config/**'],
      exclude: ['**/__tests__/**', 'i18n/locales/**', 'core/types.ts'],
    },
  },
});
