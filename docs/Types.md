# TypeScript types

Every type listed here is exported from the package entry, so you can import it with `import type`:

```ts
import type { PluginOptions, Filter, CustomFieldConfig } from '@query-kit/vue';
```

The shipped declarations are the source of truth: your editor shows each type's full shape and members on hover. This page is an index; follow the links for the documentation of each area.

## Configuration

Types used when configuring the plugin. See [Plugin initialization](Plugin-initialization).

- `PluginOptions` — the object passed to `app.use(plugin, options)`.
- `EntitySchemaLoader`, `EntityTranslationsLoader`, `EnumSchemaLoader`, `EnumTranslationsLoader`, `RequestSchemaLoader` — the loader contracts (object form) for each schema/translation source.
- `Requester`, `RequesterFunction` — the query executor, as an object (`{ request }`) or a bare function.
- `RequestParams`, `RequestResponse` — the payload a requester receives and the shape it must return.
- `AllowedOperators`, `AllowedScopes`, `AllowedProperties` — restrict the operators, scopes and properties usable per entity.
- `ComputedScopes`, `ComputedScope`, `ComputedScopeParameter` — client-side scopes defined in config.
- `ComponentList`, `ComponentEntry`, `PropertyInputs`, `InputSettings` — custom input registration (`typeInputs` / `propertyInputs`) and the `InputComponent` wrapper settings.
- `TypeRenderers`, `TypeRenderer`, `PropertyRenderers`, `RenderFunction` — custom cell renderers (`fieldTypeRenderers` / `fieldPropertyRenderers`) and the callback form.
- `IconList`, `IconConfig`, `ClassList` — icon and CSS class configuration (`icons` / `classes`).
- `DisplayOperator`, `DisplayOperatorConfig` — operator-visibility configuration.

## Schema

Types describing entity, enum and request schemas. See [Schemas](Schemas).

- `EntitySchema` — the resolved entity schema returned by `getEntitySchema` (exposes `getProperty` / `getScope`).
- `Property`, `Scope`, `ScopeParameter` — resolved members of a schema.
- `EntityTranslations` — the return shape of `entityTranslationsLoader`.
- `RawEntitySchema`, `RawInlineEntitySchema`, `RawProperty`, `RawScope`, `RawScopeParameter` — the schema you author and return from `entitySchemaLoader`, before resolution.
- `EnumSchema`, `EnumCase` — a resolved enum and its cases.
- `RawEnumSchema`, `RawEnumCase` — the enum schema you return from `enumSchemaLoader`.
- `RequestSchema`, `InlineRequestSchema` — the request schema returned by `requestSchemaLoader`.
- `TypeContainer`, `ArrayableTypeContainer` — the `type` / `enum` / `items` descriptor carried by properties and scope parameters.

## Filter

Types describing a filter tree. See [Query filter format](Query-filter-format).

- `Filter` — a filter tree node: a [condition](Query-filter-format#condition), [scope](Query-filter-format#scope), [group](Query-filter-format#group) or [entity condition](Query-filter-format#entity-condition).
- `ConditionFilter`, `ScopeFilter`, `GroupFilter`, `EntityConditionFilter` — the four node variants. `computeFilter` returns a `GroupFilter`.
- `ConditionOperator`, `GroupOperator`, `EntityConditionOperator` — the operator literal unions.

## Collection and components

Types used to type component props and models. See [Usage](Usage).

- `CustomFieldConfig` — a custom column definition (`customFields`).
- `ItemClickHandler`, `FieldClickHandler`, `PostRequestHandler`, `RequestErrorHandler`, `ExportHandler` — the callback signatures for the handler props (`onItemClick`, `onFieldClick`, `postRequest`, `onRequestError`, `onExport`).
- `SortItemField`, `SortItemProperty` — a sort entry (`{ field, order }`), as used in `v-model:sort` and in request params.
- `CollectionType` — `'infinite' | 'pagination'`.
- `FieldsEditingLocation`, `SortEditingLocation`, `FilterEditingLocation`, `CollectionSortEditingLocation` — where each editor is mounted.

## Custom components

Props received by the components you provide. See [Custom input component](Plugin-initialization#custom-input-component) and [Renderer component](Plugin-initialization#renderer-component).

- `CustomInputProps` — the props a custom input component receives.
- `FieldRendererProps` — the props a custom renderer component receives.
