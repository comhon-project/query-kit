import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from './vite.shared.js';

// The playground: dev server (`vite`) and its static build (`vite build`).
// The static build is deployed under a GitHub Pages sub-path, so `base` points
// there for production; dev stays at root. Keyed on `mode`, not `command`:
// `vite preview` runs with command 'serve' but mode 'production', so keying on
// command would serve preview at '/' while the built assets expect the sub-path.
// Output goes to `dist-playground` (outside the npm `files` list) so it can
// never leak into the published package.
export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  base: mode === 'production' ? '/query-kit/playground/' : '/',
  root: './playground',
  resolve,
  build: {
    // Preserve light-dark() in the theme CSS. Vite 8's default target
    // ('baseline-widely-available') makes lightningcss lower light-dark() into a
    // prefers-color-scheme polyfill, which only follows the OS and ignores the
    // `color-scheme` the theme switcher forces. Targeting browsers that support
    // light-dark() natively keeps it intact so manual light/dark switching works
    // in the built site.
    cssTarget: ['chrome123', 'firefox120', 'safari17.5'],
    outDir: '../dist-playground',
    emptyOutDir: true,
  },
}));
