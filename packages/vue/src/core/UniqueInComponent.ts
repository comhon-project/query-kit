import type { Component } from 'vue';
import type { NativeHtmlComponent } from '@core/types';

export class UniqueInComponent {
  constructor(public component: Component | NativeHtmlComponent) {}
}
