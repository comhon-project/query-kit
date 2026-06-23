import type { Component } from 'vue';
import type { NativeHtmlComponent } from '@core/types';

export interface InputSettings {
  /** The input renders multiple values itself (e.g. a multi-select) instead of an array of inputs. */
  multiple?: boolean;
  /** Trim string values before they reach the model. */
  trim?: boolean;
  /** Replace an empty string with `undefined` (applied after `trim`). */
  emptyToUndefined?: boolean;
  /** Debounce the value write to the model, in ms. A number (incl. 0) defers; omitted = synchronous. */
  debounce?: number;
}

/**
 * Wraps an input component with behavior settings applied to its value
 * (multiple/trim/emptyToUndefined/debounce). The wrapper is optional: a raw
 * component or native type string carries no settings.
 */
export class InputComponent {
  constructor(
    public component: Component | NativeHtmlComponent,
    public settings: InputSettings = {},
  ) {}
}
