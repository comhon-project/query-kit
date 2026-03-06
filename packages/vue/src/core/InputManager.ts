import type { Component } from 'vue';
import type { NativeHtmlComponent } from '@core/types';
import { getLeafTypeContainer, type TypeContainer, type ArrayableTypeContainer } from '@core/EntitySchema';
import { MultipleCapableComponent } from '@core/MultipleCapableComponent';
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

export type ComponentEntry = NativeHtmlComponent | Component | MultipleCapableComponent;

export type ComponentList = Record<string, ComponentEntry>;

export type PropertyInputs = Record<string, ComponentList>;

type PropertyContext = { owner: string; id: string };

const componentList: ComponentList = {
  string: 'text',
  html: 'text',
  integer: 'number',
  float: 'number',
  date: 'date',
  datetime: DateTimeInput,
  time: 'time',
  enum: new MultipleCapableComponent(SelectEnum),
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

const resolveEntry = (entry: ComponentEntry): NativeHtmlComponent | Component => {
  return entry instanceof MultipleCapableComponent ? entry.component : entry;
};

const getComponent = (container: TypeContainer, property?: PropertyContext): NativeHtmlComponent | Component => {
  const type = container.enum ? 'enum' : container.type;

  if (property) {
    const propEntry = propertyInputs[property.owner]?.[property.id];
    if (propEntry !== undefined) return resolveEntry(propEntry);
  }

  const typeEntry = typeInputs[type];
  if (typeEntry !== undefined) return resolveEntry(typeEntry);

  const entry = componentList[type];
  if (!entry) {
    throw new Error('invalid type ' + type);
  }
  return resolveEntry(entry);
};

const supportsMultiple = (container: ArrayableTypeContainer, property?: PropertyContext): boolean => {
  const leaf = getLeafTypeContainer(container);
  const type = leaf.enum ? 'enum' : leaf.type;

  if (property) {
    const propEntry = propertyInputs[property.owner]?.[property.id];
    if (propEntry !== undefined) return propEntry instanceof MultipleCapableComponent;
  }

  const typeEntry = typeInputs[type];
  if (typeEntry !== undefined) return typeEntry instanceof MultipleCapableComponent;

  return componentList[type] instanceof MultipleCapableComponent;
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
  supportsMultiple,
  isNativeHtmlComponent,
  MultipleCapableComponent,
  _resetForTesting,
};
