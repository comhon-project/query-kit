import type { Component } from 'vue';
import type { NativeHtmlComponent } from '@core/types';
import { getLeafTypeContainer, type TypeContainer, type ArrayableTypeContainer } from '@core/EntitySchema';
import { InputComponent, type InputSettings } from '@core/InputComponent';
import BooleanInput from '@components/Common/BooleanInput.vue';
import SelectEnum from '@components/Common/SelectEnum.vue';
import DateTimeInput from '@components/Common/DateTimeInput.vue';

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

export type ComponentEntry = NativeHtmlComponent | Component | InputComponent;

export type ComponentList = Record<string, ComponentEntry>;

export type PropertyInputs = Record<string, ComponentList>;

type PropertyContext = { owner: string; id: string };

const DEFAULT_DEBOUNCE = 300;

const componentList: ComponentList = {
  string: new InputComponent('text', { trim: true, emptyToUndefined: true, debounce: DEFAULT_DEBOUNCE }),
  html: new InputComponent('text', { trim: true, emptyToUndefined: true, debounce: DEFAULT_DEBOUNCE }),
  integer: new InputComponent('number', { emptyToUndefined: true, debounce: DEFAULT_DEBOUNCE }),
  float: new InputComponent('number', { emptyToUndefined: true, debounce: DEFAULT_DEBOUNCE }),
  date: new InputComponent('date', { emptyToUndefined: true, debounce: DEFAULT_DEBOUNCE }),
  time: new InputComponent('time', { emptyToUndefined: true, debounce: DEFAULT_DEBOUNCE }),
  datetime: new InputComponent(DateTimeInput, { debounce: DEFAULT_DEBOUNCE }),
  enum: new InputComponent(SelectEnum, { multiple: true }),
  boolean: BooleanInput,
};

const typeInputs: ComponentList = {};
const propertyInputs: PropertyInputs = {};

const registerTypeInputs = (custom: ComponentList): void => {
  Object.assign(typeInputs, custom);
};

const registerPropertyInputs = (custom: PropertyInputs): void => {
  for (const entity in custom) {
    if (!propertyInputs[entity]) propertyInputs[entity] = {};
    Object.assign(propertyInputs[entity], custom[entity]);
  }
};

const typeOf = (container: TypeContainer): string => (container.enum ? 'enum' : container.type);

const resolveComponent = (entry: ComponentEntry): NativeHtmlComponent | Component => {
  return entry instanceof InputComponent ? entry.component : entry;
};

const resolveSettings = (entry: ComponentEntry): InputSettings => {
  return entry instanceof InputComponent ? entry.settings : {};
};

const findEntry = (type: string, property?: PropertyContext): ComponentEntry | undefined => {
  if (property) {
    const propEntry = propertyInputs[property.owner]?.[property.id];
    if (propEntry !== undefined) return propEntry;
  }
  if (typeInputs[type] !== undefined) return typeInputs[type];
  return componentList[type];
};

const getComponent = (container: TypeContainer, property?: PropertyContext): NativeHtmlComponent | Component => {
  const type = typeOf(container);
  const entry = findEntry(type, property);
  if (!entry) {
    throw new Error('invalid type ' + type);
  }
  return resolveComponent(entry);
};

const getSettings = (container: TypeContainer, property?: PropertyContext): InputSettings => {
  const entry = findEntry(typeOf(container), property);
  return entry ? resolveSettings(entry) : {};
};

const supportsMultiple = (container: ArrayableTypeContainer, property?: PropertyContext): boolean => {
  const entry = findEntry(typeOf(getLeafTypeContainer(container)), property);
  return entry instanceof InputComponent && entry.settings.multiple === true;
};

const isNativeHtmlComponent = (component: string | Component): boolean => {
  return typeof component === 'string' && component in nativeHtmlComponents;
};

const defaultComponentList: ComponentList = { ...componentList };

function _resetForTesting(): void {
  for (const key in componentList) delete componentList[key];
  Object.assign(componentList, defaultComponentList);
  for (const key in typeInputs) delete typeInputs[key];
  for (const key in propertyInputs) delete propertyInputs[key];
}

export {
  registerTypeInputs,
  registerPropertyInputs,
  getComponent,
  getSettings,
  supportsMultiple,
  isNativeHtmlComponent,
  InputComponent,
  _resetForTesting,
};
