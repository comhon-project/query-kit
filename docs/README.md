# query-kit

`query-kit` is a Vue 3 library that permits to build complex queries and display items collections with an intuitive user interface.

## Features

- **Filter builder**: Create complex nested filters with conditions, groups, scopes and relationship conditions
- **Data collection**: Display paginated or infinite-scroll tables with sortable columns
- **Schema-driven**: Define your entities once and let the UI adapt automatically
- **Customizable**: Custom inputs, cell renderers, icons, CSS classes and themes
- **i18n**: Built-in support for 11 languages with runtime locale switching
- **Accessible**: Keyboard navigation, ARIA tree patterns, screen reader support

## Quick start

```js
import { createApp } from 'vue';
import { plugin } from '@query-kit/vue';
import '@query-kit/themes/default';

const app = createApp(App);
app.use(plugin, {
  entitySchemaLoader: (entity) => fetch(`/api/schemas/${entity}`).then((r) => r.json()),
  requester: (params) => fetch('/api/search', { method: 'POST', body: JSON.stringify(params) }).then((r) => r.json()),
  icons: 'default',
});
app.mount('#app');
```

```html
<QkitSearch entity="user" v-model:filter="filter" v-model:columns="columns" />
```

## Preview

![Capture d'ecran du 2023-08-27 04-36-01](https://github.com/user-attachments/assets/8ac614bc-75e9-45b3-8cac-2117407b0b20)
