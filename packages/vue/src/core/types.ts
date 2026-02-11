import type { Component } from 'vue';
import type { Property, ArrayableTypeContainer } from '@core/EntitySchema';
import type { AllowedOperators } from '@core/OperatorManager';

/**
 * Shared type definitions for query-kit
 */

// Filter types used throughout the filter system
export type FilterType = 'condition' | 'scope' | 'group' | 'relationship_condition';
export type ContainerFilterType = 'group' | 'relationship_condition';

// Render function signature for custom cell renderers
export type RenderFunction = (
  value: unknown,
  rowValue: Record<string, unknown>,
  columnId: string,
  locale: string,
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

/** Request parameters */
export interface RequestParams {
  entity: string;
  order?: { property: string; order: string }[];
  page: number;
  limit: number;
  filter?: Filter;
  properties: string[];
}

/** Request response */
export interface RequestResponse {
  collection: Record<string, unknown>[];
  count: number;
}

/** Requester interface */
export interface Requester {
  request: (params: RequestParams) => Promise<RequestResponse>;
  flattened?: boolean;
}

export type RequesterFunction = (params: RequestParams) => Promise<RequestResponse>;

// ==================== Cell Renderer Props ====================

export interface CellRendererProps {
  columnId: string;
  property: Property;
  type: ArrayableTypeContainer;
  value: unknown;
  rowValue: Record<string, unknown>;
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

export interface RelationshipConditionFilter extends BaseFilter, WithOperator {
  type: 'relationship_condition';
  property: string;
  filter?: Filter;
}

export type Filter = ConditionFilter | ScopeFilter | GroupFilter | RelationshipConditionFilter;

export type FilterWithOperator = ConditionFilter | GroupFilter | RelationshipConditionFilter;

// ==================== Collection Types ====================

export interface OrderByItem {
  column: string;
  order: 'asc' | 'desc';
}

export interface CustomColumnConfig {
  label: string | ((locale: string) => string);
  order?: string[];
  renderer?: Component | RenderFunction | string;
  onCellClick?: (value: unknown, rowValue: Record<string, unknown>, columnId: string, event: MouseEvent) => void;
  open?: boolean;
}

export type CollectionType = 'infinite' | 'pagination';

// ==================== Option Types ====================

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
}

// ==================== Button Types ====================

export type ButtonType = 'button' | 'submit' | 'reset';
export type ButtonClass = 'btn_primary' | 'btn_danger' | 'btn';

// ==================== Display Props ====================

export interface DisplayOperatorConfig {
  condition?: boolean;
  group?: boolean;
  relationship_condition?: boolean;
}

export type DisplayOperator = boolean | DisplayOperatorConfig;

// ==================== Allowed Filter Configurations ====================

/** Allowed scopes per entity */
export type AllowedScopes = Record<string, string[]>;

/** Allowed properties per entity */
export type AllowedProperties = Record<string, string[]>;

// ==================== Custom Input Props ====================

export interface CustomInputProps {
  modelValue: unknown;
  entity: string;
  target: ArrayableTypeContainer;
  multiple: boolean;
  disabled?: boolean;
  enumId?: string;
}

// ==================== Builder Config (Provide/Inject) ====================

export interface BuilderConfig {
  allowedScopes?: AllowedScopes;
  allowedProperties?: AllowedProperties;
  allowedOperators?: AllowedOperators;
  displayOperator?: DisplayOperator;
  userTimezone?: string;
  requestTimezone?: string;
}
