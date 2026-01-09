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
