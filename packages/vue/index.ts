export { default as plugin } from './src/core/Plugin';
export { locale } from './src/i18n/i18n';
export { InputComponent, type InputSettings } from './src/core/InputComponent';
export { computeFilter } from './src/core/computeFilter';
export {
  EntitySchema,
  resolve as getEntitySchema,
  getEntityTranslation,
  getPropertyTranslation,
  getScopeTranslation,
  getScopeParameterTranslation,
} from './src/core/EntitySchema';

export type { PluginOptions } from './src/core/Plugin';

export type {
  Filter,
  ConditionFilter,
  ScopeFilter,
  GroupFilter,
  EntityConditionFilter,
  RenderFunction,
  Requester,
  RequesterFunction,
  RequestParams,
  RequestResponse,
  SortItemProperty,
  SortItemField,
  CustomFieldConfig,
  ItemClickHandler,
  FieldClickHandler,
  PostRequestHandler,
  RequestErrorHandler,
  ExportHandler,
  CollectionType,
  AllowedScopes,
  AllowedProperties,
  DisplayOperator,
  DisplayOperatorConfig,
  FieldsEditingLocation,
  SortEditingLocation,
  FilterEditingLocation,
  CollectionSortEditingLocation,
  CustomInputProps,
  FieldRendererProps,
} from './src/core/types';

export type {
  Property,
  Scope,
  ScopeParameter,
  EntityTranslations,
  TypeContainer,
  ArrayableTypeContainer,
  RawEntitySchema,
  RawInlineEntitySchema,
  RawProperty,
  RawScope,
  RawScopeParameter,
  EntitySchemaLoader,
  EntityTranslationsLoader,
} from './src/core/EntitySchema';

export type {
  EnumSchema,
  EnumCase,
  RawEnumSchema,
  RawEnumCase,
  EnumSchemaLoader,
  EnumTranslationsLoader,
} from './src/core/EnumSchema';

export type {
  RequestSchema,
  InlineRequestSchema,
  SchemaLoader as RequestSchemaLoader,
} from './src/core/RequestSchema';

export type {
  AllowedOperators,
  ConditionOperator,
  GroupOperator,
  EntityConditionOperator,
} from './src/core/OperatorManager';

export type {
  ComputedScopes,
  ComputedScope,
  ComputedScopeParameter,
} from './src/core/ComputedScopesManager';

export type { IconList, IconConfig } from './src/core/IconManager';

export type { ClassList } from './src/core/ClassManager';

export type {
  ComponentList,
  ComponentEntry,
  PropertyInputs,
} from './src/core/InputManager';

export type {
  TypeRenderers,
  TypeRenderer,
  PropertyRenderers,
} from './src/core/FieldRendererManager';
