# Import and use plugin

## Table of contents

- [Schema loaders](#schema-loaders)
- [Computed scopes](#computed-scopes)
- [Requester](#requester)
- [Icons](#icons)
- [Classes](#classes)
- [Inputs](#inputs)
- [Cell renderers](#cell-renderers)
- [Allowed operators](#allowed-operators)
- [Locale](#locale)
- [Render HTML](#render-html)
- [Basic options](#basic-options)

---

Before any usage of `query-kit`, you have to define your plugin configuration:

```js
import { plugin } from "@query-kit/vue";

app.use(plugin, {
  // here is your configuration
})
```

# Configurations

## Schema loaders

query-kit doesn't know your data model upfront — loaders are functions you provide so it can fetch schemas and translations on demand. They are called lazily (on first use) and their results are cached. See [Schemas](Schemas) for the schema formats and [I18n](I18n) for the translation formats.

All loaders share the same pattern: they can be a function or an object with a `load` method. The function must return a promise with the expected data.

### Entity Schema loader

| key                | type               | required |
| ------------------ | ------------------ | -------- |
| entitySchemaLoader | function or object | true     |

Loads entity structures. The function receives the entity id. See [Entity schema](Schemas#entity-schema).

```js
const config = {
  entitySchemaLoader: (entity) => fetch(`/api/schemas/entities/${entity}`).then(r => r.json()),
}
```

### Entity Translations loader

| key                      | type               | required |
| ------------------------ | ------------------ | -------- |
| entityTranslationsLoader | function or object | false    |

Loads translations for entity properties, scopes, and scope parameters. The function receives the entity id and the current locale. See [Entity translations](I18n#entity-translations).

```js
const config = {
  entityTranslationsLoader: (entity, locale) => fetch(`/api/schemas/entities/${entity}/translations/${locale}`).then(r => r.json()),
}
```

### Enum Schema loader

| key              | type               | required |
| ---------------- | ------------------ | -------- |
| enumSchemaLoader | function or object | false    |

Loads enum structures. The function receives the enum id. See [Enum schema](Schemas#enum-schema).

```js
const config = {
  enumSchemaLoader: (enumId) => fetch(`/api/schemas/enums/${enumId}`).then(r => r.json()),
}
```

### Enum Translations loader

| key                    | type               | required |
| ---------------------- | ------------------ | -------- |
| enumTranslationsLoader | function or object | false    |

Loads translations for enum cases. The function receives the enum id and the current locale. See [Enum translations](I18n#enum-translations).

```js
const config = {
  enumTranslationsLoader: (enumId, locale) => fetch(`/api/schemas/enums/${enumId}/translations/${locale}`).then(r => r.json()),
}
```

### Request Schema loader

| key                 | type               | required |
| ------------------- | ------------------ | -------- |
| requestSchemaLoader | function or object | false    |

Loads request schemas defining which properties are filterable and sortable. The function receives the entity id. See [Request schema](Schemas#request-schema).

```js
const config = {
  requestSchemaLoader: (entityId) => fetch(`/api/schemas/requests/${entityId}`).then(r => r.json()),
}
```

## Computed scopes

| key            | type   | required |
| -------------- | ------ | -------- |
| computedScopes | object | false    |

Computed scopes are virtual scopes that transform user input into filter structures at query time. They are useful when you need shortcut filters that the server doesn't provide as scopes.

A computed scope definition:

| key         | type     | required | description                                                                                |
| ----------- | -------- | -------- | ------------------------------------------------------------------------------------------ |
| id          | string   | true     | the unique identifier of computed scope                                                    |
| name        | string   | false    | the scope name to display if you don't manage i18n                                         |
| translation | function | false    | function that must return the localized scope name according `locale` parameter             |
| parameters  | array    | false    | array of parameter objects with `id`, `name`, `type` and optionally `nullable`, `translation` |
| computed    | function | true     | function that must return a filter usable when requesting server (first parameter is the array of parameter values) |

Each parameter can also have a `translation` function `(locale) => string` for localized labels.

Computed scopes must be associated to an entity.

Example:

```js
const config = {
  computedScopes: {
    user: [
      {
        id: 'quick_search',
        translation: (locale) => locale == 'fr' ? 'recherche rapide' : 'quick search',
        parameters: [{
          id: 'value',
          type: 'string',
          nullable: false,
          translation: (locale) => locale == 'fr' ? 'valeur' : 'value',
        }],
        computed: (parameters) => {
          const value = parameters[0];
          return {
            type: 'group',
            operator: 'or',
            filters: [
              { property: 'first_name', operator: 'like', value: value },
              { property: 'last_name', operator: 'like', value: value },
              { property: 'email', operator: 'like', value: value },
            ],
          };
        },
      },
    ],
    organization: [/* ... */],
  },
}
```

## Requester

| key       | type               | required | default   |
| --------- | ------------------ | -------- | --------- |
| requester | function or object | false    | undefined |

The default requester that will fetch data from server. When registered globally via plugin options, it will be used by all `QkitCollection` components. Each component can override this default by passing its own requester as a prop.

If config is an object, it MUST contain a `request` property that contains a value of type function.
The request function MUST return a promise that contains results of search request. The first parameter is the request data.

Example:

```js
const config = {
  requester: async (data) => {
    const response = await fetch('https://my.domain.com/endpoint', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }
}
```

The injected data object contains the following values:

```js
data.entity     // the entity id (user, company, post, etc...)
data.order      // the sort order of requested items (array of { property, order })
data.page       // the current page number (1-based)
data.limit      // the count limit of returned items (pagination)
data.filter     // the request filters
data.properties // the properties that must be returned for each returned items
```

The requester MUST return an object that contains:

- a `count` value that corresponds to the total items count that match the filter (not only the returned items count)
- a `collection` that is an array of items
- a `limit` that is the number of items per page

Example:

```js
{
  count: 245,
  limit: 20,
  collection: [
    {id: 25, first_name: 'Jane'},
    {id: 26, first_name: 'John'},
    /* ... */
  ]
}
```

Your requester may return items with nested objects:

```js
{
  first_name: 'Jane',
  favorite_fruits: ['apple', 'orange'],
  company: {
    brand_name: 'awesome brand name',
    headquarter: {
      address: '5 street nowhere'
    }
  }
}
```

## Icons

### Icons

| key   | type             | required |
| ----- | ---------------- | -------- |
| icons | object or `'default'` | false    |

You may register icons that will be used to display some contents, typically some buttons will use icons. By default, no icons are registered, so the associated text will be displayed instead.

You can pass `'default'` to use the built-in theme icons (requires `@query-kit/themes`):

```js
const config = {
  icons: 'default',
}
```

Or you can define custom icons. Each key is the context where the icon will be used, each value can be:

- **A string**: bound as a single prop to the `iconComponent` (default `i`). The prop name is `iconPropName` (default `class`).
  ```js
  { add: 'my-icon-add' }
  // renders: <i class="my-icon-add"></i>
  ```

- **An object**: all properties are spread as props via `v-bind` on the component. The `component` property determines which component to render (falls back to `iconComponent` if absent).
  ```js
  { add: { class: 'my-icon-add' } }
  // renders: <i class="my-icon-add"></i>

  { add: { icon: 'fa-solid fa-plus', component: 'FontAwesomeIcon' } }
  // renders: <FontAwesomeIcon icon="fa-solid fa-plus" component="FontAwesomeIcon" />

  { add: { icon: 'fa-solid fa-plus', component: 'FontAwesomeIcon', fade: '' } }
  // renders: <FontAwesomeIcon icon="fa-solid fa-plus" component="FontAwesomeIcon" fade="" />
  ```

Available icon keys: `add`, `add_filter`, `add_value`, `delete`, `close`, `previous`, `next`, `collapse`, `sort`, `minus`, `undo`, `redo`, `reset`, `search`, `confirm`, `export`, `columns`, `grip`, `paginated_list`, `infinite_list`, `loading`.

### Icon component

| key           | type   | required | default |
| ------------- | ------ | -------- | ------- |
| iconComponent | string | false    | `'i'`   |

The default component to use to display icon when component is not directly defined on icon. It may be a simple HTML tag or vue component.

### Icon prop name

| key          | type   | required | default   |
| ------------ | ------ | -------- | --------- |
| iconPropName | string | false    | `'class'` |

The default prop name where the icon value will be placed (only if defined icon is a simple string).

### Example with FontAwesome

```js
const config = {
  icons: {
    add: 'fa-solid fa-plus',
  },
  iconComponent: 'FontAwesomeIcon',
  iconPropName: 'icon',
}
```

It will render the following icon:

```html
<FontAwesomeIcon icon="fa-solid fa-plus" />
```

## Classes

| key     | type   | required |
| ------- | ------ | -------- |
| classes | object | false    |

By default, rendered HTML elements will have some predefined classes, but you may override these class names to define your own classes.
**Note:** if you don't use [predefined themes](Installation#theme), the default classes come without any style. So you can customize them as you want.

Example:

```js
const config = {
  classes: {
    modal: 'my-modal-class',
    group: 'my-group-class',
    btn: 'my-btn-class',
  }
}
```

You can find all classes keys [here](https://github.com/comhon-project/query-kit/blob/main/packages/vue/src/core/ClassManager.ts).

## Inputs

### Type inputs

| key        | type   | required |
| ---------- | ------ | -------- |
| typeInputs | object | false    |

You may define custom input components for specific data types. Basic property filters have predefined inputs (like string, integer, date, enumerations...) but for more complex properties that have a very specific type, this is typically where you should use custom inputs. You can override existing basic inputs too.

To register the component, you will have to link it to a property type:

```js
const config = {
  typeInputs: {
    my_very_specific_type: 'my-very-specific-component',
    integer: 'my-integer-component-override',
  }
}
```

By default when a filter is used with `in` or `not_in` operators, the filter component can be displayed several times. But you can define a custom component that directly manages these operators and it will be rendered only once. To do so, you will have to specify that your component must be displayed only once:

```js
const config = {
  typeInputs: {
    my_other_specific_type: {
      component: 'my-other-specific-component',
      unique: true,
    },
  }
}
```

### Property inputs

| key            | type   | required |
| -------------- | ------ | -------- |
| propertyInputs | object | false    |

You may define custom input components for specific entity properties. Property inputs take priority over type inputs.

```js
const config = {
  propertyInputs: {
    user: {
      email: 'email',
      country: 'country-input',
    },
  }
}
```

## Cell renderers

### Type renderers

| key               | type   | required |
| ----------------- | ------ | -------- |
| cellTypeRenderers | object | false    |

You may define some callbacks or components to render values in the collection. Each callback or component must be associated to a type.

```js
const config = {
  cellTypeRenderers: {
    integer: CellIntegerComponent,
    string: (cellValue, rowValue, columnId, locale) => cellValue + ' suffix',
  }
}
```

The callback receives four parameters: `cellValue`, `rowValue`, `columnId`, and `locale`.

### Property renderers

| key                   | type   | required |
| --------------------- | ------ | -------- |
| cellPropertyRenderers | object | false    |

You may define some callbacks or components to render values in the collection. Each callback or component must be associated to an entity property.

```js
const config = {
  cellPropertyRenderers: {
    user: {
      weight: (cellValue, rowValue, columnId, locale) => cellValue + " kg",
      country: CellCountryComponent,
    },
  }
}
```

The property renderers have a higher priority than type renderers.

## Allowed operators

| key       | type   | required |
| --------- | ------ | -------- |
| operators | object | false    |

The `operators` option allows you to define which operators will be usable in the request builder.

The default operators are:

```js
{
  condition: {
    basic: [
      '=', '<>', '<', '<=', '>', '>=', 'in', 'not_in', 'like', 'not_like',
      'begins_with', 'doesnt_begin_with', 'ends_with', 'doesnt_end_with', 'null', 'not_null',
    ],
    enum: ['=', '<>', 'in', 'not_in', 'null', 'not_null'],
    date: ['=', '<>', '<', '<=', '>', '>=', 'in', 'not_in', 'null', 'not_null'],
    time: ['=', '<>', '<', '<=', '>', '>=', 'in', 'not_in', 'null', 'not_null'],
    datetime: ['=', '<>', '<', '<=', '>', '>=', 'in', 'not_in', 'null', 'not_null'],
    boolean: ['=', 'null', 'not_null'],
    array: ['contains', 'not_contains', 'null', 'not_null'],
  },
  group: ['and', 'or'],
  entity_condition: ['has', 'has_not'],
}
```

The `basic` operators are operators usable in condition that has a type not referenced in previous list (like `integer`, `string` ...).
You can override any operator list with your own, you can specify new types with their allowed operators too.

**Case-insensitive operators** are also available: `ilike`, `not_ilike`, `ibegins_with`, `idoesnt_begin_with`, `iends_with`, `idoesnt_end_with`. These are case-insensitive versions of their counterparts. See [aliasInsensitiveLabels](#alias-insensitive-labels) to control their display labels.

Example:

```js
const config = {
  operators: {
    condition: {
      basic: ['=', '<>', 'like', 'not_like', 'ilike', 'not_ilike', 'null', 'not_null'],
      datetime: ['=', '<>'],
    },
    group: ['and'],
  }
}
```

Each value will completely replace the default one.

## Locale

### Default locale

| key           | type   | required | default |
| ------------- | ------ | -------- | ------- |
| defaultLocale | string | false    | `'en'`  |

The default locale to use.

### Fallback locale

| key            | type   | required | default |
| -------------- | ------ | -------- | ------- |
| fallbackLocale | string | false    | `'en'`  |

The fallback locale to use when a translation is not found in current locale.

## Render HTML

| key        | type    | required | default |
| ---------- | ------- | -------- | ------- |
| renderHtml | boolean | false    | `false` |

By default, properties with type `html` are rendered as simple text to prevent XSS attacks. But you may render them as HTML by setting `renderHtml` to `true`.

```js
const config = {
  renderHtml: true
}
```

## Basic options

These options can be overridden per-component via props. See [Usage](Usage) for details.

| key                    | type              | required | default          | description                                                                                                                                                             |
| ---------------------- | ----------------- | -------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| userTimezone           | string            | false    | `'UTC'`          | Display time in given timezone and time inputs are considered in given timezone.                                                                                         |
| requestTimezone        | string            | false    | `'UTC'`          | Timezone to use when requesting server.                                                                                                                                 |
| limit                  | number            | false    | `undefined`      | Default page size limit for collections.                                                                                                                                |
| debounce               | number            | false    | `1000`           | Time in milliseconds to wait after the last user input before considering the filter as changed.                                                                        |
| manual                 | boolean           | false    | `false`          | If `true`, the user must click a button to execute the query. Otherwise the query is computed automatically after filter changes.                                        |
| allowReset             | boolean           | false    | `true`           | Display a button to permit user to reset query to original state.                                                                                                       |
| allowUndo              | boolean           | false    | `true`           | Enable undo button for filter changes.                                                                                                                                  |
| allowRedo              | boolean           | false    | `true`           | Enable redo button for filter changes.                                                                                                                                  |
| quickSort              | boolean           | false    | `true`           | Enable single-click column sorting in collections.                                                                                                                      |
| editColumns            | boolean           | false    | `false`          | Enable column editor UI in collections (allows users to add/remove/reorder columns).                                                                                    |
| allowedCollectionTypes | array             | false    | `['pagination']` | Determine which collection display types are available. Allowed values are `'pagination'` and `'infinite'`. If both are given, user will be able to switch between them. |
| aliasInsensitiveLabels | boolean           | false    | `false`          | When `true`, case-insensitive operators (e.g. `ilike`) are displayed with the label of their case-sensitive counterpart (e.g. `like`).                                  |
| displayOperator        | boolean or object | false    | `true`           | Show/hide operator selectors in the filter builder. [[1]](#note-display-operator)                                                                                       |
| displayCount           | boolean           | false    | `true`           | Show/hide total results count in collection header.                                                                                                                     |

<span id="note-display-operator">[1]</span> `displayOperator` can be a simple boolean to toggle all operators, or an object to control visibility per filter type:

```js
{
  condition: true,
  group: false,
  entity_condition: true,
}
```
