# Schemas

Before using `query-kit` you should already be familiar with the concept of a schema. A schema is a representation of an entity. These schemas will be used to build query filter and display collection.

## Entity schema

An entity schema describes the structure of an entity with its properties, relationships, and scopes.

```js
{
  id: 'user',
  properties: [
    { id: 'id', type: 'integer' },
    { id: 'first_name', type: 'string', name: 'First Name' },
    { id: 'status', type: 'string', enum: 'status' },
    { id: 'company', type: 'relationship', relationship_type: 'belongs_to', entity: 'organization' },
    { id: 'favorite_fruits', type: 'array', items: { type: 'string', enum: 'fruit' } },
    { id: 'metadata', type: 'object', entity: 'user.metadata' },
  ],
  unique_identifier: 'id',
  primary_identifiers: ['last_name', 'first_name'],
  natural_sort: ['last_name', 'first_name'],
  scopes: [
    { id: 'active', parameters: [] },
    { id: 'search', parameters: [{ id: 'value', type: 'string', nullable: false }] },
  ],
  entities: {
    metadata: {
      properties: [
        { id: 'label', type: 'string' },
        { id: 'address', type: 'object', entity: 'user.address' },
      ],
      natural_sort: ['label'],
    },
    address: {
      properties: [
        { id: 'city', type: 'string' },
        { id: 'zip', type: 'string' },
      ],
    },
  },
}
```

### Schema fields

| field               | type   | required | description                                                                 |
| ------------------- | ------ | -------- | --------------------------------------------------------------------------- |
| id                  | string | true     | Unique identifier for the entity.                                           |
| name                | string | false    | Display name (used as label if no translation is defined).                  |
| properties          | array  | true     | Array of property definitions.                                              |
| unique_identifier   | string | false    | Property id used as unique key (e.g. `'id'`).                               |
| primary_identifiers | array  | false    | Property ids displayed when entity appears as a relationship cell value.    |
| natural_sort        | array  | false    | Property ids used as default sort order when sorting a relationship column. |
| scopes              | array  | false    | Array of scope definitions.                                                 |
| entities            | object | false    | Inline nested entity definitions (key is the nested entity name).           |

### Property types

| type           | description                                 |
| -------------- | ------------------------------------------- |
| `string`       | Text field                                  |
| `integer`      | Whole number                                |
| `float`        | Decimal number                              |
| `boolean`      | True/False                                  |
| `date`         | Date only                                   |
| `time`         | Time only                                   |
| `datetime`     | Date and time                               |
| `html`         | HTML content (rendered as text by default)  |
| `array`        | Array of typed items                        |
| `object`       | Nested entity (references an inline entity) |
| `relationship` | Relationship to another entity              |

Custom types (e.g. `country`) can also be used. They will work with [custom inputs](Plugin-initialization#inputs) and [custom cell renderers](Plugin-initialization#cell-renderers).

### Property definition

| field             | type   | required | description                                                               |
| ----------------- | ------ | -------- | ------------------------------------------------------------------------- |
| id                | string | true     | Property identifier.                                                      |
| name              | string | false    | Display name (used if no translation is defined).                         |
| type              | string | true     | One of the property types above.                                          |
| enum              | string | false    | Enum schema id (for `string` properties with a predefined set of values). |
| relationship_type | string | false    | Required for `relationship` type. See relationship types below.           |
| entity            | string | false    | Related entity id. Used by `object` type and `relationship` type (except `morph_to`). |
| entities          | array  | false    | Array of entity ids (for `morph_to` relationships with specific targets). |
| items             | object | false    | For `array` type: `{ type, enum? }` describing the array items.           |

### Relationship types

| type              | description                         |
| ----------------- | ----------------------------------- |
| `belongs_to`      | Many-to-one relationship            |
| `has_one`         | One-to-one relationship             |
| `has_many`        | One-to-many relationship            |
| `belongs_to_many` | Many-to-many relationship           |
| `morph_to`        | Polymorphic relationship (single)   |
| `morph_to_many`   | Polymorphic relationship (multiple) |

For `morph_to`, you can optionally restrict the allowed entity types with the `entities` field:

```js
{ id: 'commentable', type: 'relationship', relationship_type: 'morph_to', entities: ['post', 'video'] }
```

If `entities` is not set, the user will not be able to add nested filters on the relationship.

### Scopes

Scopes are named filters defined at the schema level. They can have typed parameters.

```js
{
  id: 'search',
  name: 'Search',
  parameters: [
    { id: 'value', name: 'search value', type: 'string', nullable: false },
  ],
}
```

| field      | type   | required | description                     |
| ---------- | ------ | -------- | ------------------------------- |
| id         | string | true     | Scope identifier.               |
| name       | string | false    | Display name.                   |
| parameters | array  | false    | Array of parameter definitions. |

Each parameter:

| field    | type    | required | description                                          |
| -------- | ------- | -------- | ---------------------------------------------------- |
| id       | string  | true     | Parameter identifier.                                |
| name     | string  | false    | Display name.                                        |
| type     | string  | true     | Type (string, integer, float, date, datetime, time). |
| enum     | string  | false    | Enum schema id.                                      |
| nullable | boolean | false    | If `false`, the parameter value is required.         |

### Local entities

Local entities are entities defined inline in the `entities` field of the parent schema. They are meant to be referenced only within that schema. Their entity id is prefixed with the parent entity id (e.g. `user.metadata`, `user.address`).

Both `object` and `relationship` properties can reference either a local entity or an external entity. In practice, `relationship` properties typically reference external entities while `object` properties typically reference local entities.

## Enum schema

An enum schema defines a set of allowed values for a property.

```js
{
  id: 'status',
  cases: [
    { id: 'active', name: 'Active' },
    { id: 'inactive', name: 'Inactive' },
    { id: 'pending', name: 'Pending' },
  ],
}
```

| field | type   | required | description          |
| ----- | ------ | -------- | -------------------- |
| id    | string | true     | Enum identifier.     |
| cases | array  | true     | Array of enum cases. |

Each case:

| field | type   | required | description                                    |
| ----- | ------ | -------- | ---------------------------------------------- |
| id    | string | true     | The actual value.                              |
| name  | string | false    | Display name (used if no translation defined). |

## Request schema

A request schema defines which properties are filterable and sortable for an entity. It is loaded by the `requestSchemaLoader`. See [Plugin initialization](Plugin-initialization#request-schema-loader).

```js
{
  filtrable: {
    properties: ['first_name', 'last_name', 'age', 'company', 'metadata'],
    scopes: ['active', 'search'],
  },
  sortable: ['first_name', 'last_name', 'age'],
  entities: {
    metadata: {
      filtrable: {
        properties: ['label'],
        scopes: [],
      },
      sortable: [],
    },
  },
}
```

A `requestSchemaLoader` must be configured for the filter builder to work. Only properties and scopes listed in the request schema will be available for filtering and sorting.

## i18n

Schemas properties, scopes and enum cases may be localized. See [Plugin initialization](Plugin-initialization#entity-translations-loader) to know how to register your translations.
