# Usage

## Table of contents

- [Query builder component](#query-builder-component)
- [Collection component](#collection-component)
- [Search component](#search-component)

---

# Query builder component
The query builder component will permit to user to build its request by defining some filters.

## Usage
```js
<script setup>
import { ref } from "vue";

const filter = ref(null);
</script>

<template>
  <QkitQueryBuilder entity="user" v-model="filter"/>
</template>
```

## Props
The default values below are the library defaults — they can be overridden globally via the [plugin configuration](Plugin-initialization#basic-options).  
Props marked with 🔗 support two-way binding via `v-model`.

| key                   | v‑model | type               | required | default     | description                                                                                                      |
| --------------------- | :-----: | ------------------ | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| entity                |         | string             | true     | -           | The entity id (user, company, post...)                                                                           |
| modelValue            |   🔗    | object             | false    | `null`      | The query to build. Given object will be updated when user will make changes. Accepts any filter type or `null`; non-group filters are auto-wrapped in a top-level group. More info on filter format [here](Query-filter-format). |
| allowReset            |         | boolean            | false    | `true`      | Display a button to permit user to reset query to original state.                                                |
| allowUndo             |         | boolean            | false    | `true`      | Enable undo button for filter changes.                                                                           |
| allowRedo             |         | boolean            | false    | `true`      | Enable redo button for filter changes.                                                                           |
| allowedProperties     |         | object             | false    | -           | Restrict allowed properties. More information [here](Usage#allowed-properties).                                  |
| allowedScopes         |         | object             | false    | -           | Restrict allowed scopes. More information [here](Usage#allowed-scopes).                                          |
| allowedOperators      |         | object             | false    | -           | Restrict allowed operators. More information [here](Usage#allowed-operators).                                    |
| displayOperator       |         | boolean or object  | false    | `true`      | Display operators. More information [here](Usage#display-operator).                                              |
| userTimezone          |         | string             | false    | `'UTC'`     | Display time in given timezone and time inputs are considered in given timezone.                                  |
| requestTimezone       |         | string             | false    | `'UTC'`     | Timezone to use when requesting server.                                                                          |
| debounce              |         | number             | false    | `1000`      | Time in ms to wait after a user input to compute the query.                                                      |
| manual                |         | boolean            | false    | `false`     | If true, user must click a button to compute the query. Otherwise the query is computed automatically.            |
| collectionId          |         | string             | false    | -           | ID of linked collection for skip-link navigation.                                                                |
| aliasInsensitiveLabels|         | boolean            | false    | `false`     | Display case-insensitive operators with their case-sensitive label.                                               |
| actionsLocation       |         | string             | false    | `'header'`  | Where the actions bar (undo/redo/reset/validate) is rendered: `'header'` (above the filters) or `'embedded'` (inside the root group). |

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
### Computed
A `computed` event is triggered when the query filter is computed (debounced according to the `debounce` prop). The computed filter format may be different than the original filter (e.g. computed scopes are resolved, empty conditions are stripped). The event receives two parameters:

1. `computedFilter` - the filter ready to be sent to the server
2. `manual` - boolean indicating if the event was triggered by user action (`true`) or by automatic computation (`false`)

```js
<QkitQueryBuilder @computed="(computedFilter, manual) => handle(computedFilter, manual)" />
```

### Actions location
The actions bar (undo / redo / reset / validate buttons) is rendered above the filters by default. You can embed it inside the root group instead with the `actionsLocation` prop:
```html
<!-- default: actions bar in a header above the filter tree -->
<QkitQueryBuilder entity="user" v-model="filter" />

<!-- actions bar embedded inside the root group -->
<QkitQueryBuilder entity="user" v-model="filter" actions-location="embedded" />
```

# Collection component
The collection component will display data fetched.

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

The default values below are the library defaults — they can be overridden globally via the [plugin configuration](Plugin-initialization#basic-options).  
Props marked with 🔗 support two-way binding via `v-model:<key>`.

| key                    | v‑model | type               | required | default          | description                                                                                                                     |
| ---------------------- | :-----: | ------------------ | -------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| entity                 |         | string             | true     | -                | The entity id (user, company, post...)                                                                                          |
| fields                 |   🔗    | array              | true     | -                | Fields to display in the collection. More information [here](Usage#fields).                                                     |
| sort                   |   🔗    | array              | false    | -                | Sort order. Array of field ids (strings) or objects `{ field: string, order: 'asc'\|'desc' }`.                                  |
| page                   |   🔗    | number             | false    | `1`              | Current page number.                                                                                                            |
| customFields           |         | object             | false    | -                | Permit to customize collection headers and cells rendering. More information [here](Usage#custom-fields).                       |
| filter                 |         | object             | false    | -                | The filter to apply when requesting server.                                                                                     |
| directQuery            |         | boolean            | false    | `true`           | Request server and display results when component is mounted.                                                                   |
| limit                  |         | number             | false    | `undefined`      | The count limit of fetched items per page.                                                                                      |
| quickSort              |         | boolean            | false    | `true`           | Permit to sort results when clicking on collection column headers.                                                              |
| postRequest            |         | function           | false    | -                | Function called just after querying server (permit to modify fetched items). Signature: `(collection) => void \| Promise<void>`. |
| allowedCollectionTypes |         | array              | false    | `['pagination']` | Display types. Allowed values: `'pagination'` and `'infinite'`.                                                                 |
| displayCount           |         | boolean            | false    | `true`           | Display total items count that match query.                                                                                     |
| editFields             |         | boolean            | false    | `false`          | Allows users to add/remove/reorder fields.                                                                                      |
| userTimezone           |         | string             | false    | `'UTC'`          | Display time in given timezone.                                                                                                 |
| requestTimezone        |         | string             | false    | `'UTC'`          | Timezone to use when requesting server.                                                                                         |
| requester              |         | function or object | false    | -                | Override the requester defined in global plugin configuration.                                                                  |
| queryBuilderId         |         | string             | false    | -                | ID of linked query builder for skip-link navigation.                                                                           |
| onRowClick             |         | function           | false    | -                | Row click handler. Signature: `(row, event) => void`.                                                                           |
| onExport               |         | function           | false    | -                | Export handler. When provided, an export button is displayed. Signature: `(filter?) => void`.                                    |

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
The search component combines the two previous components, making it the simplest way to set up a full search interface with a single component.

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

The default values below are the library defaults — they can be overridden globally via the [plugin configuration](Plugin-initialization#basic-options).  
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
| manual                 |         | boolean            | false    | `false`          | If true, user must click a button to request server.                                                           |
| directQuery            |         | boolean            | false    | `true`           | Request server and display results when component is mounted.                                                  |
| debounce               |         | number             | false    | `1000`           | Time in ms to wait after a user input to compute the query.                                                    |
| limit                  |         | number             | false    | `undefined`      | The count limit of fetched items per page.                                                                     |
| quickSort              |         | boolean            | false    | `true`           | Permit to sort results when clicking on column headers.                                                        |
| postRequest            |         | function           | false    | -                | Function called just after querying server.                                                                    |
| allowedCollectionTypes |         | array              | false    | `['pagination']` | Display types: `'pagination'` and/or `'infinite'`.                                                             |
| displayCount           |         | boolean            | false    | `true`           | Display total items count.                                                                                     |
| editFields             |         | boolean            | false    | `false`          | Allows users to add/remove/reorder fields.                                                                     |
| requester              |         | function or object | false    | -                | Override the requester defined in plugin configuration.                                                        |
| onRowClick             |         | function           | false    | -                | Row click handler: `(row, event) => void`.                                                                     |
| onExport               |         | function           | false    | -                | Export handler (displays export button when provided): `(filter?) => void`.                                    |
| aliasInsensitiveLabels |         | boolean            | false    | `false`          | Display case-insensitive operators with their case-sensitive label.                                             |
| actionsLocation        |         | string             | false    | `'header'`       | Where the actions bar is rendered: `'header'` (above the filters) or `'embedded'` (inside the root group).      |
