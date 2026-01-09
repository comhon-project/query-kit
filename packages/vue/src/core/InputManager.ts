import type { Component } from 'vue';
import type { NativeHtmlComponent } from '@core/types';
import type { TypeContainer } from '@core/EntitySchema';
import { UniqueInComponent } from '@core/UniqueInComponent';
import BooleanInput from '@components/Common/BooleanInput.vue';
import SelectEnum from '@components/Common/SelectEnum.vue';

const nativeHtmlComponents: Record<NativeHtmlComponent, true> = {
  // input types
  button: true,
  checkbox: true,
  color: true,
  date: true,
  'datetime-local': true,
  email: true,
  file: true,
  hidden: true,
  image: true,
  month: true,
  number: true,
  password: true,
  radio: true,
  range: true,
  reset: true,
  search: true,
  submit: true,
  tel: true,
  text: true,
  time: true,
  url: true,
  week: true,
  // tags
  textarea: true,
  select: true,
};

export type ComponentEntry = NativeHtmlComponent | Component | UniqueInComponent;

export type ComponentList = Record<string, ComponentEntry>;

const componentList: ComponentList = {
  string: 'text',
  html: 'text',
  integer: 'number',
  float: 'number',
  date: 'date',
  datetime: 'datetime-local',
  time: 'time',
  enum: new UniqueInComponent(SelectEnum),
  boolean: BooleanInput,
};

const registerComponents = (custom: Partial<ComponentList>): void => {
  Object.assign(componentList, custom);
};

const getComponent = (container: TypeContainer): NativeHtmlComponent | Component | undefined => {
  const type = container.enum ? 'enum' : container.type;
  const entry = componentList[type];
  if (!entry) {
    return undefined;
  }
  if (entry instanceof UniqueInComponent) {
    return entry.component;
  }
  return entry;
};

const isUniqueInComponent = (container: TypeContainer): boolean => {
  const type = container.enum ? 'enum' : container.type;
  const entry = componentList[type];
  return entry instanceof UniqueInComponent;
};

const isNativeHtmlComponent = (component: string | Component): boolean => {
  return typeof component === 'string' && component in nativeHtmlComponents;
};

export { registerComponents, getComponent, isUniqueInComponent, isNativeHtmlComponent };
