import type { Component } from 'vue';
import type { NativeHtmlComponent } from '@core/types';

export class MultipleCapableComponent {
  constructor(public component: Component | NativeHtmlComponent) {}
}
