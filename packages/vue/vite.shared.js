import { fileURLToPath, URL } from 'node:url';

// Shared resolution used by both the library build (vite.config.js) and the
// playground app (vite.playground.config.js). Kept in one place so the aliases
// and the `source` condition (import the library from src, not from dist)
// cannot drift between the two configs.
export const resolve = {
  conditions: ['source'],
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
    '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
    '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
    '@i18n': fileURLToPath(new URL('./src/i18n', import.meta.url)),
    '@config': fileURLToPath(new URL('./src/config', import.meta.url)),
    '@tests': fileURLToPath(new URL('./src/__tests__', import.meta.url)),
  },
};
