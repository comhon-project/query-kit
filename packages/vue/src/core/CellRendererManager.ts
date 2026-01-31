import type { Component } from 'vue';
import type { RenderFunction } from '@core/types';
import type { Property, TypeContainer } from '@core/EntitySchema';
import { Array, Boolean, Date, DateTime, Enum, ForeignEntity, Html, Time } from '@components/Common/Renderers';

export type TypeRenderer = Component | RenderFunction | null;
export type TypeRenderers = Record<string, TypeRenderer>;
export type PropertyRenderers = Record<string, TypeRenderers>;

const typeRenderers: TypeRenderers = {
  string: null,
  integer: null,
  float: null,
  enum: Enum,
  html: Html,
  date: Date,
  datetime: DateTime,
  time: Time,
  boolean: Boolean,
  relationship: ForeignEntity,
  array: Array,
};

const propertyRenderers: PropertyRenderers = {};

const registerTypeRenderers = (custom: TypeRenderers): void => {
  Object.assign(typeRenderers, custom);
};

const registerPropertyRenderers = (custom: PropertyRenderers): void => {
  Object.assign(propertyRenderers, custom);
};

const getTypeRenderer = (container: TypeContainer): TypeRenderer => {
  return container.enum ? typeRenderers.enum : (typeRenderers[container.type] ?? null);
};

const getPropertyRenderer = (property: Property): TypeRenderer => {
  return propertyRenderers[property.owner]?.[property.id] ?? getTypeRenderer(property);
};

export { registerTypeRenderers, registerPropertyRenderers, getPropertyRenderer, getTypeRenderer };
