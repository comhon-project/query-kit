# Usage

## Table of contents

- [Query builder component](#query-builder-component)
- [Collection component](#collection-component)
- [Search component](#search-component)

---

# Query builder component
The query builder is a visual editor for building a server query. Through `v-model` it edits two independent parts: the **filter** (nested `and`/`or` groups of conditions, scopes and relationship filters) and, when `editFields` is enabled, the **fields** to display and their order. Both share a single undo/redo/reset history. It is a pure editor: it only mutates its models and never queries the server itself (see [Validate](#validate)).

## Usage
```js
<script setup>
import { ref } from "vue";

const filter = ref(null);
</script>

<template>
  <QkitQueryBuilder entity="user" v-model:filter="filter"/>
</template>
```

## Props
The default values below are the library defaults; they can be overridden globally via the [plugin configuration](Plugin-initialization#basic-options).  
Props marked with 🔗 support two-way binding via `v-model`.

| key                   | v‑model | type               | required | default     | description                                                                                                      |
| --------------------- | :-----: | ------------------ | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| entity                |         | string             | true     | -           | The entity id (user, company, post...)                                                                           |
| filter                |   🔗    | object             | false    | `null`      | The query to build. Given object will be updated when user will make changes. Accepts any filter type or `null`; non-group filters are auto-wrapped in a top-level group. More info on filter format [here](Query-filter-format). |
| fields                |   🔗    | array              | false    | `[]`        | Fields edited by the inline fields builder (only rendered when `editFields` is enabled). More information [here](Usage#fields). |
| customFields          |         | object             | false    | -           | Customize the labels shown in the fields builder. More information [here](Usage#custom-fields).                  |
| editFields            |         | boolean            | false    | `false`     | Display an inline fields builder to add/remove/reorder the fields.                                               |
| allowReset            |         | boolean            | false    | `true`      | Display a button to permit user to reset query to original state.                                                |
| allowUndo             |         | boolean            | false    | `true`      | Enable undo button for filter changes.                                                                           |
| allowRedo             |         | boolean            | false    | `true`      | Enable redo button for filter changes.                                                                           |
| allowedProperties     |         | object             | false    | -           | Restrict allowed properties. More information [here](Usage#allowed-properties).                                  |
| allowedScopes         |         | object             | false    | -           | Restrict allowed scopes. More information [here](Usage#allowed-scopes).                                          |
| allowedOperators      |         | object             | false    | -           | Restrict allowed operators. More information [here](Usage#allowed-operators).                                    |
| displayOperator       |         | boolean or object  | false    | `true`      | Display operators. More information [here](Usage#display-operator).                                              |
| userTimezone          |         | string             | false    | `'UTC'`     | Display time in given timezone and time inputs are considered in given timezone.                                  |
| requestTimezone       |         | string             | false    | `'UTC'`     | Timezone to use when requesting server.                                                                          |
| manual                |         | boolean            | false    | `false`     | If true, show a validate button and emit `validate` on click instead of letting the collection auto-query.        |
| collectionId          |         | string             | false    | -           | ID of linked collection for skip-link navigation.                                                                |
| aliasInsensitiveLabels|         | boolean            | false    | `false`     | Display case-insensitive operators with their case-sensitive label.                                               |

### Allowed properties
Restrict allowed properties that may be part of query.
```js
  <QkitQueryBuilder
    entity="user"
    :allowed-properties="{
      user: ['last_name', 'birth_date'],
      organization: ['company_name', 'address'],
    }"
  />
```
### Allowed scopes
Restrict allowed scopes that may be part of query.
```js
  <QkitQueryBuilder
    entity="user"
    :allowed-scopes="{
      user: ['my_user_scope'],
    }"
  />
```
### Allowed operators
Restrict allowed operators that may be part of query. This prop will override the plugin setting [operators](Plugin-initialization#allowed-operators).
```js
  <QkitQueryBuilder
    entity="user"
    :allowed-operators="{
      group: ['or'],
      entity_condition: ['has'],
      condition: {
        basic: ['=', '<>'],
        string: ['=', '<>', 'like', 'not_like'],
      },
    }"
  />
```

### Display operator
By default operators are displayed but you can define if you want to display operators or not. For example if you want to allow only operator `and` for group filters, there's no need to display the operator.

You can simply disable all operators:
```js
<QkitQueryBuilder :display-operator="false" />
```
Or you can disable operators by filter type:
```js
// disable only group operators
<QkitQueryBuilder :display-operator="{ group: false, condition: true, entity_condition: true }" />
```

## Events
### Validate
The query builder is a pure editor: it only mutates its `v-model` filter. It does **not** compute the filter or query the server; that is the collection's job (it watches the filter, debounces, runs `computeFilter`, and requests). In `manual` mode, the query builder shows a validate button; clicking it emits a `validate` event so the parent can trigger the query (e.g. `QkitSearch` calls the collection's exposed `submit()`):

```js
<QkitQueryBuilder @validate="() => runTheQuery()" />
```

If you use `QkitQueryBuilder` on its own (without a collection), compute the server-ready filter yourself from the `v-model:filter` with the exported `computeFilter` util.

# Collection component
The collection is the data table that queries the server and renders the results. It takes a raw filter, computes the server-ready query from it, requests the server, and displays the returned records as fully customizable columns, with sorting and pagination or infinite scroll.

## Usage
```js
<script setup>
import { ref } from "vue";

const fields = ref(['first_name', 'last_name']);
</script>

<template>
  <QkitCollection entity="user" v-model:fields="fields"/>
</template>
```

## Props

The default values below are the library defaults; they can be overridden globally via the [plugin configuration](Plugin-initialization#basic-options).  
Props marked with 🔗 support two-way binding via `v-model:<key>`.

| key                    | v‑model | type               | required | default          | description                                                                                                                     |
| ---------------------- | :-----: | ------------------ | -------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| entity                 |         | string             | true     | -                | The entity id (user, company, post...)                                                                                          |
| fields                 |   🔗    | array              | true     | -                | Fields to display in the collection. More information [here](Usage#fields).                                                     |
| sort                   |   🔗    | array              | false    | -                | Sort order. Array of field ids (strings) or objects `{ field: string, order: 'asc'\|'desc' }`.                                  |
| page                   |   🔗    | number             | false    | `1`              | Current page number.                                                                                                            |
| customFields           |         | object             | false    | -                | Permit to customize collection headers and cells rendering. More information [here](Usage#custom-fields).                       |
| filter                 |         | object             | false    | -                | The raw filter. The collection runs `computeFilter` on it before requesting the server.                                          |
| manual                 |         | boolean            | false    | `false`          | If true, prop changes to `filter`/`fields` do not auto-request; call the exposed `submit()` method to trigger the request. Direct interactions in the collection UI (header sort, fields editor, pagination) always request immediately. |
| debounce               |         | number             | false    | `1000`           | Time in ms to wait after a `filter`/`fields` change before requesting the server. `0` requests immediately.                      |
| directQuery            |         | boolean            | false    | `true`           | Request server and display results when component is mounted.                                                                   |
| limit                  |         | number             | false    | `undefined`      | The count limit of fetched items per page.                                                                                      |
| quickSort              |         | boolean            | false    | `true`           | Permit to sort results when clicking on collection column headers.                                                              |
| postRequest            |         | function           | false    | -                | Function called just after querying server (permit to modify fetched items). Signature: `(collection) => void \| Promise<void>`. |
| onRequestError         |         | function           | false    | -                | Called when a server request fails (requester rejection, `postRequest` rejection, or an invalid response). Overrides the plugin `onRequestError`. The error is otherwise swallowed. Signature: `(error) => void`. |
| allowedCollectionTypes |         | array              | false    | `['pagination']` | Display types. Allowed values: `'pagination'` and `'infinite'`.                                                                 |
| displayCount           |         | boolean            | false    | `true`           | Display total items count that match query.                                                                                     |
| editFields             |         | boolean            | false    | `false`          | Allows users to add/remove/reorder fields.                                                                                      |
| naturalSortWhenEmpty   |         | boolean            | false    | `false`          | When `sort` is empty, send the entity's `natural_sort` to the server (request-only; the `sort` model stays empty). No-op if the schema declares no `natural_sort`. |
| userTimezone           |         | string             | false    | `'UTC'`          | Display time in given timezone.                                                                                                 |
| requestTimezone        |         | string             | false    | `'UTC'`          | Timezone to use when requesting server.                                                                                         |
| requester              |         | function or object | false    | -                | Override the requester defined in global plugin configuration.                                                                  |
| queryBuilderId         |         | string             | false    | -                | ID of linked query builder for skip-link navigation.                                                                           |
| onItemClick            |         | function           | false    | -                | Item click handler (fires when a record is clicked). Signature: `(item, event) => void`.                                        |
| onExport               |         | function           | false    | -                | Export handler. When provided, an export button is displayed (disabled while the filter is initializing or invalid). Receives the computed filter: the current one, or in `manual` mode the one committed by the last validate/mount/entity change. Signature: `(filter?) => void`. |

### Fields
Fields to display in the collection. Each value must be a unique identifier for the current collection. Each value may be a property (a property of the requested entity or a property of nested objects) and/or a custom field identifier. If the field is a property, its label and renderer are determined automatically, but you may override them as you want with custom fields.

Example:
```js
const fields = ref([
  'first_name',
  'age',
  'company',
  'company.address',
  'friend',
  'my_custom_field', // MUST be defined in custom fields
]);
```
#### Fields and relationships
When a field contains a property that is a relationship (`has_one` or `belongs_to`), the field value will contain `primary_identifiers` of the corresponding entity. For example in the previous example, the `company` field would contain the brand name of the company and the `friend` field would contain first name and last name of the person (if there are no `primary_identifiers` defined, the `unique_identifier` will be displayed). When using relationship fields, the related entity data is fetched from the server too, so it is very convenient to route user on a specific resource.

### Custom fields
Custom fields permit to customize field label and rendering. Each key must be a field id and each value an object that describe what you want to customize for the field. A custom field may be associated to an entity property or not. If custom field is associated to an entity property, its label and renderer are determined automatically, but you may override them as you want.

| key         | type                      | required | description                                                                            |
| ----------- | ------------------------- | -------- | -------------------------------------------------------------------------------------- |
| open        | boolean                   | false    | If the field is NOT associated to a property, you must set this attribute to `true`.   |
| label       | string or function        | false    | The field label. Use a function for i18n: `(locale) => string`.                        |
| renderer    | string, object or function| false    | The renderer that will display the field value. It might be a component or a callback. |
| sort        | array of strings          | false    | Properties to use for sorting this field (overrides default sorting behavior).          |
| properties  | array of strings          | false    | Additional entity properties to declare in the request for this field (useful for `open` fields whose renderer reads multiple entity properties). |
| onFieldClick| function                  | false    | Function called on field click: `(value, item, fieldId, event) => void`.               |

Example:
```js
const customFields = {
  first_name: {
    label: (locale) => locale == 'fr' ? 'nom genial' : 'awesome name',
    renderer: FirstNameRenderer,
  },
  company: {
    onFieldClick: (value, item, fieldId, event) => {
      event.stopPropagation();
      router.push(`/companies/${value.id}/overview`);
    },
  },
  full_name: {
    open: true, // not bound to an entity property
    label: (locale) => locale == 'fr' ? 'nom complet' : 'full name',
    properties: ['first_name', 'last_name'], // declared in the request so the server knows the renderer needs them
    renderer: (value, item) => `${item.first_name} ${item.last_name}`,
  },
};
```

# Search component
The search component wires the query builder and the collection together into a ready-to-use search interface: what the user builds in the query builder drives what the collection queries and displays, with no glue code on your side.

## Usage
```js
<script setup>
import { ref } from "vue";

const filter = ref(null);
const fields = ref(['first_name', 'last_name']);
</script>

<template>
  <QkitSearch entity="user" v-model:filter="filter" v-model:fields="fields"/>
</template>
```

## Props

The default values below are the library defaults; they can be overridden globally via the [plugin configuration](Plugin-initialization#basic-options).  
Props marked with 🔗 support two-way binding via `v-model:<key>`.

| key                    | v‑model | type               | required | default          | description                                                                                                    |
| ---------------------- | :-----: | ------------------ | -------- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| entity                 |         | string             | true     | -                | The entity id (user, company, post...)                                                                         |
| filter                 |   🔗    | object             | false    | `null`           | The query to build. Accepts any filter type or `null`; non-group filters are auto-wrapped in a top-level group. More info on filter format [here](Query-filter-format).                                    |
| fields                 |   🔗    | array              | true     | -                | Fields to display. More information [here](Usage#fields).                                                      |
| sort                   |   🔗    | array              | false    | -                | Sort order. Array of field ids or objects `{ field: string, order: 'asc'\|'desc' }`.                           |
| page                   |   🔗    | number             | false    | `1`              | Current page number.                                                                                           |
| customFields           |         | object             | false    | -                | Customize collection headers and cells rendering. More information [here](Usage#custom-fields).                |
| allowReset             |         | boolean            | false    | `true`           | Display a button to permit user to reset query.                                                                |
| allowUndo              |         | boolean            | false    | `true`           | Enable undo button.                                                                                            |
| allowRedo              |         | boolean            | false    | `true`           | Enable redo button.                                                                                            |
| allowedProperties      |         | object             | false    | -                | Restrict allowed properties. More information [here](Usage#allowed-properties).                                |
| allowedScopes          |         | object             | false    | -                | Restrict allowed scopes. More information [here](Usage#allowed-scopes).                                        |
| allowedOperators       |         | object             | false    | -                | Restrict allowed operators. More information [here](Usage#allowed-operators).                                  |
| displayOperator        |         | boolean or object  | false    | `true`           | Display operators. More information [here](Usage#display-operator).                                            |
| userTimezone           |         | string             | false    | `'UTC'`          | Display time in given timezone.                                                                                |
| requestTimezone        |         | string             | false    | `'UTC'`          | Timezone to use when requesting server.                                                                        |
| manual                 |         | boolean            | false    | `false`          | If true, filter changes request the server only when the user clicks the validate button. Direct interactions in the collection UI (header sort, fields editor, pagination) always request immediately. |
| directQuery            |         | boolean            | false    | `true`           | Request server and display results when component is mounted.                                                  |
| debounce               |         | number             | false    | `1000`           | Time in ms to wait after a `filter`/`fields` change before requesting the server. `0` requests immediately.    |
| limit                  |         | number             | false    | `undefined`      | The count limit of fetched items per page.                                                                     |
| quickSort              |         | boolean            | false    | `true`           | Permit to sort results when clicking on column headers.                                                        |
| postRequest            |         | function           | false    | -                | Function called just after querying server.                                                                    |
| onRequestError         |         | function           | false    | -                | Called when a server request fails. Overrides the plugin `onRequestError`. Signature: `(error) => void`.       |
| allowedCollectionTypes |         | array              | false    | `['pagination']` | Display types: `'pagination'` and/or `'infinite'`.                                                             |
| displayCount           |         | boolean            | false    | `true`           | Display total items count.                                                                                     |
| editFields             |         | string             | false    | `'none'`         | Where users can add/remove/reorder fields: `'query-builder'` (inline in the query builder), `'collection'` (columns button in the collection header), or `'none'`. |
| naturalSortWhenEmpty   |         | boolean            | false    | `false`          | When `sort` is empty, send the entity's `natural_sort` to the server (request-only). No-op without `natural_sort`. |
| requester              |         | function or object | false    | -                | Override the requester defined in plugin configuration.                                                        |
| onItemClick            |         | function           | false    | -                | Item click handler (fires when a record is clicked): `(item, event) => void`.                                  |
| onExport               |         | function           | false    | -                | Export handler (displays export button when provided). Receives the computed filter: the current one, or the last validated one in `manual` mode. Signature: `(filter?) => void`. |
| aliasInsensitiveLabels |         | boolean            | false    | `false`          | Display case-insensitive operators with their case-sensitive label.                                             |
