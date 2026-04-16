# Intro
Query filter permits to build complex requests to fetch data from server according to a given filter. There are 4 types of filter: condition, scope, group and entity condition. When you pass query filter to `Builder` or `Search` components it must be of type group.

# Condition
A condition filter contains at least a property and an operator. It may contain a value. The property MUST NOT correspond to a relationship.
```js
{
  type: 'condition',
  property: 'last_name',
  operator: '=',
  value: 'Doe'
}
```

# Group
A group filter contains at least an operator. It may contain filters. Each filter might be a condition, a scope, a group or entity condition.
```js
{
  type: 'group',
  operator: 'or',
  filters: [
    {
      type: 'condition',
      property: 'last_name',
      operator: '=',
      value: 'Doe'
    },
    {
      type: 'group',
      operator: 'and',
      filters: [...]
    }
  ]
}
```

# Entity condition
An entity condition filter contains at least a property and an operator. It may contain a filter. The property MUST be a `relationship` or `object` type property (i.e. a property that links to one or more entities). The filter might be a condition, a scope, a group or entity condition.

```js
{
  type: 'entity_condition',
  property: 'company',
  operator: 'has',
  filter: {
    type: 'condition',
    property: 'brand_name',
    operator: '=',
    value: 'Acme'
  }
}
```

For `morph_to` relationships, the `entities` field specifies which entity types to target. It is required (non-empty) when a nested `filter` is provided, and optional otherwise.

```js
{
  type: 'entity_condition',
  property: 'favorite_client',
  operator: 'has',
  entities: ['user'],
  filter: {
    type: 'condition',
    property: 'first_name',
    operator: '=',
    value: 'Jane'
  }
}
```

# Scope
A scope is like a condition but is not related to a property. It contains at least an id. It may contain parameters (an array of values). The scope might be defined on the entity schema or in the [computed scopes](Plugin-initialization#computed-scopes).
```js
{
  type: 'group',
  operator: 'or',
  filters: [
    {
      type: 'scope',
      id: 'my_scope_without_parameters',
    },
    {
      type: 'scope',
      id: 'my_scope_with_parameters',
      parameters: ['value_one', 'value_two'],
    },
  ]
}
```

# Interactions
## Visible
A filter is visible by default but you can hide it from the user. It will still be included in the query, but not rendered in the builder UI.
```js
{
  type: 'condition',
  property: 'last_name',
  operator: '=',
  value: 'Doe',
  visible: false,
}
```
## Editable
A filter is editable by default but you can make it not editable by the user.
```js
{
  type: 'condition',
  property: 'last_name',
  operator: '=',
  value: 'Doe',
  editable: false,
}
```
## Removable
A filter is removable by default but you can make it not removable by the user.
```js
{
  type: 'condition',
  property: 'last_name',
  operator: '=',
  value: 'Doe',
  removable: false,
}
```

# Allowed operators

## Condition operators

| operator              | description                          |
| --------------------- | ------------------------------------ |
| `=`                   | equals                               |
| `<>`                  | not equals                           |
| `<`                   | less than                            |
| `<=`                  | less than or equal                   |
| `>`                   | greater than                         |
| `>=`                  | greater than or equal                |
| `like`                | contains (case-sensitive)            |
| `not_like`            | not contains (case-sensitive)        |
| `ilike`               | contains (case-insensitive)          |
| `not_ilike`           | not contains (case-insensitive)      |
| `begins_with`         | starts with (case-sensitive)         |
| `doesnt_begin_with`   | doesn't start with (case-sensitive)  |
| `ibegins_with`        | starts with (case-insensitive)       |
| `idoesnt_begin_with`  | doesn't start with (case-insensitive)|
| `ends_with`           | ends with (case-sensitive)           |
| `doesnt_end_with`     | doesn't end with (case-sensitive)    |
| `iends_with`          | ends with (case-insensitive)         |
| `idoesnt_end_with`    | doesn't end with (case-insensitive)  |
| `in`                  | value is in list                     |
| `not_in`              | value is not in list                 |
| `contains`            | array contains value                 |
| `not_contains`        | array doesn't contain value          |
| `null`                | is null                              |
| `not_null`            | is not null                          |

## Group operators

`and`, `or`

## Entity condition operators

`has`, `has_not`

See [Plugin initialization](Plugin-initialization#allowed-operators) to know how to customize allowed operators.

# Example
```js
<script setup>
import { ref } from "vue";

const filter = ref({
  type: 'group',
  operator: 'and',
  filters: [
    {
      type: 'condition',
      property: 'last_name',
      operator: '=',
    },
    {
      type: 'condition',
      property: 'birth_date',
      operator: '>',
      value: '2001-12-12'
    },
    {
      type: 'entity_condition',
      property: 'company',
      operator: 'has',
      filter: {
        type: 'condition',
        property: 'brand_name',
        operator: 'like',
        value: 'tech',
      }
    }
  ]
});
</script>

<template>
  <QkitBuilder entity="user" v-model="filter"/>
</template>
```
The builder will appear with an empty condition on last_name, a filled condition on birth_date, and a relationship condition on company.
