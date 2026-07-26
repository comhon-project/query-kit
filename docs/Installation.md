# Installation and configuration

## Install

Install `query-kit` with npm:
```bash
npm i @query-kit/vue
```

Then import and use the `query-kit` plugin (in your `app.js` or `main.js` or equivalent):
```js
import { createApp } from 'vue'
import { plugin } from "@query-kit/vue";
import App from 'App.vue'

const config = {/* here goes your config */};

createApp(App).use(plugin, config).mount('#app')
```

See [Plugin initialization](Plugin-initialization) for the full configuration reference.

## Theme

By default `query-kit` comes without any style, but if you don't want to define your own styles, you can use the predefined theme. To do so:

1. Install the theme package:
```bash
npm i @query-kit/themes
```

2. Import the theme (in your `app.js` or `main.js` or equivalent):
```js
import "@query-kit/themes/default";
```

The default theme uses CSS custom variables for easy customization and supports dark mode via `prefers-color-scheme`.

> **Switching light/dark manually?** The theme colors use the CSS `light-dark()` function, which follows the OS automatically. If you instead toggle the scheme by setting the `color-scheme` property yourself, make sure your build keeps `light-dark()` intact: with conservative browser targets (such as Vite's default `baseline-widely-available`), it is rewritten to a `prefers-color-scheme` fallback that only follows the OS, and manual toggling silently stops working. Set your build's CSS target to browsers that support it natively (Chrome 123+, Firefox 120+, Safari 17.5+). For Vite, this is the `build.cssTarget` option.

3. To use the built-in theme icons, pass `'default'` to the `icons` option:
```js
app.use(plugin, {
  icons: 'default',
  // ...
})
```

## Exports

The `@query-kit/vue` package exports the following:

```js
import {
  plugin,    // Vue plugin to install via app.use()
  locale,    // Ref<string> for runtime locale switching
  InputComponent, // Wrapper to attach settings to a custom input component
  computeFilter, // Build a server-ready filter from a raw filter
  getEntitySchema,
  getEntityTranslation,
  getPropertyTranslation,
  getScopeTranslation,
  getScopeParameterTranslation,
} from "@query-kit/vue";
```
