import type { Component } from 'vue';
import type { Property, RawScopeParameter, ArrayableTypeContainer, EntitySchema } from '@core/EntitySchema';
import type { AllowedOperators } from '@core/OperatorManager';

/**
 * Shared type definitions for query-kit
 */

// Filter types used throughout the filter system
export type FilterType = 'condition' | 'scope' | 'group' | 'entity_condition';
export type ContainerFilterType = 'group' | 'entity_condition';

// Render function signature for custom field renderers
export type RenderFunction = (
  value: unknown,
  item: Record<string, unknown>,
  fieldId: string,
  locale: string,
  index?: number,
) => unknown;

// Native HTML form elements
export type NativeHtmlComponent =
  | 'button'
  | 'checkbox'
  | 'color'
  | 'date'
  | 'datetime-local'
  | 'email'
  | 'file'
  | 'hidden'
  | 'image'
  | 'month'
  | 'number'
  | 'password'
  | 'radio'
  | 'range'
  | 'reset'
  | 'search'
  | 'submit'
  | 'tel'
  | 'text'
  | 'time'
  | 'url'
  | 'week'
  | 'textarea'
  | 'select';

// ==================== Requester Types ====================

export interface SortItemProperty {
  property: string;
  order: 'asc' | 'desc';
}

/** Request parameters */
export interface RequestParams {
  entity: string;
  sort?: SortItemProperty[];
  page: number;
  limit?: number;
  filter?: Filter;
  properties: string[];
}

/** Request response */
export interface RequestResponse {
  collection: Record<string, unknown>[];
  count: number;
  limit: number;
}

/** Requester interface */
export interface Requester {
  request: (params: RequestParams) => Promise<RequestResponse>;
}

export type RequesterFunction = (params: RequestParams) => Promise<RequestResponse>;

// ==================== Field Renderer Props ====================

export interface FieldRendererProps {
  fieldId: string;
  property: Property;
  type: ArrayableTypeContainer;
  value: unknown;
  item: Record<string, unknown>;
  index?: number;
  requestTimezone: string;
  userTimezone: string;
}

// ==================== Filters ====================

interface BaseFilter {
  key?: string | number;
  type: FilterType;
  removable?: boolean;
  editable?: boolean;
  visible?: boolean;
}

interface WithOperator {
  operator: string;
}

export interface ConditionFilter extends BaseFilter, WithOperator {
  type: 'condition';
  property: string;
  value?: unknown;
}

export interface ScopeFilter extends BaseFilter {
  type: 'scope';
  id: string;
  parameters?: unknown[];
}

export interface GroupFilter extends BaseFilter, WithOperator {
  type: 'group';
  filters: Filter[];
}

export interface EntityConditionFilter extends BaseFilter, WithOperator {
  type: 'entity_condition';
  property: string;
  entities?: string[];
  filter?: Filter;
  count_operator?: string;
  count?: number;
}

export type Filter = ConditionFilter | ScopeFilter | GroupFilter | EntityConditionFilter;

export type FilterWithOperator = ConditionFilter | GroupFilter | EntityConditionFilter;

// ==================== Search Types ====================

export type FieldsEditingLocation = 'query-builder' | 'collection' | 'none';

export type SortEditingLocation = 'query-builder' | CollectionSortEditingLocation;

export type FilterEditingLocation = 'query-builder' | 'none';

// ==================== Collection Types ====================

export interface SortItemField {
  field: string;
  order: 'asc' | 'desc';
}

export type ItemClickHandler = (item: Record<string, unknown>, event: MouseEvent | KeyboardEvent) => void;
export type FieldClickHandler = (value: unknown, item: Record<string, unknown>, fieldId: string, event: MouseEvent) => void;
export type PostRequestHandler = (collection: Record<string, unknown>[]) => void | Promise<void>;
export type RequestErrorHandler = (error: unknown) => void;
export type ExportHandler = (filter?: Filter) => void;

export interface CustomFieldConfig {
  label: string | ((locale: string) => string);
  sort?: string[];
  properties?: string[];
  renderer?: Component | RenderFunction | string;
  onFieldClick?: FieldClickHandler;
  open?: boolean;
}

export type CollectionType = 'infinite' | 'pagination';

export type CollectionSortEditingLocation = 'collection-modal' | 'collection-column' | 'none';

export interface CollectionContent {
  collection: Record<string, unknown>[];
  fieldsProperties: Record<string, Property | undefined>;
  replaced: boolean;
}

// ==================== Option Types ====================

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
}

// ==================== Button Types ====================

export type ButtonType = 'button' | 'submit' | 'reset';

// ==================== Display Props ====================

export interface DisplayOperatorConfig {
  condition?: boolean;
  group?: boolean;
  entity_condition?: boolean;
}

export type DisplayOperator = boolean | DisplayOperatorConfig;

// ==================== Allowed Filter Configurations ====================

/** Allowed scopes per entity */
export type AllowedScopes = Record<string, string[]>;

/** Allowed properties per entity */
export type AllowedProperties = Record<string, string[]>;

// ==================== Custom Input Props ====================

export interface CustomInputProps {
  target: Property | RawScopeParameter;
  entitySchema: EntitySchema;
  multiple: boolean;
  disabled: boolean;
  userTimezone: string;
  requestTimezone: string;
}

// ==================== Filter Builder Config (Provide/Inject) ====================

export interface FilterBuilderConfig {
  allowedScopes?: AllowedScopes;
  allowedProperties?: AllowedProperties;
  allowedOperators?: AllowedOperators;
  displayOperator: DisplayOperator;
  userTimezone: string;
  requestTimezone: string;
  aliasInsensitiveLabels: boolean;
}

// ==================== Collection Config (Provide/Inject) ====================

export interface CollectionConfig {
  userTimezone: string;
  requestTimezone: string;
  editSort: CollectionSortEditingLocation;
  displayCount: boolean;
  editFields: boolean;
  naturalSortWhenEmpty: boolean;
  allowedCollectionTypes: CollectionType[];
  reflow: boolean;
}
