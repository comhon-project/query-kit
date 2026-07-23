# @query-kit/vue

Vue 3 query builder and filter UI components, plus a schema-driven data table for displaying the results. Build complex nested filter and query conditions, then let users browse, sort and paginate the matching data collection, with the actual querying delegated to your own server.

**[Try the live playground →](https://comhon-project.github.io/query-kit/playground/)**

![query-kit screenshot](https://github.com/user-attachments/assets/8ac614bc-75e9-45b3-8cac-2117407b0b20)

## Features

- **Query / filter builder**: visual editor for nested AND/OR groups, conditions, operators, scopes and relationship conditions.
- **Data collection / table**: display results with pagination or infinite scroll, sortable columns, and an editable fields (columns) selector.
- **Schema-driven**: entity, enum and request schemas drive the available properties, operators and inputs.
- **Server-side**: the builder produces a serializable filter that you send to your backend through a configurable requester.
- **Customizable**: custom input components, field renderers, icons, CSS classes and operators.
- **Internationalized**: built-in locales with runtime language switching.
- **Typed**: ships TypeScript declarations.

## Installation

```sh
npm i @query-kit/vue @query-kit/themes
```

## Quick start

```js
import { createApp } from 'vue';
import { plugin } from '@query-kit/vue';
import '@query-kit/themes/default';

createApp(App).use(plugin, {
  entitySchemaLoader,
  requester,
  icons: 'default',
});
```

Provide your own `entitySchemaLoader` (loads an entity's schema) and `requester` (runs the query on your backend), then drop the component in:

```html
<QkitSearch entity="user" v-model:filter="filter" v-model:fields="fields" />
```

## Documentation

Full documentation, schema format and configuration options: https://comhon-project.github.io/query-kit/

## License

[MIT](./LICENSE)
