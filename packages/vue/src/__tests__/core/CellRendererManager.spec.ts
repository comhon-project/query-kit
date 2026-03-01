import { describe, it, expect, afterEach } from 'vitest';
import { defineComponent } from 'vue';

import {
  getTypeRenderer,
  getPropertyRenderer,
  registerTypeRenderers,
  registerPropertyRenderers,
  _resetForTesting,
} from '@core/CellRendererManager';
import type { Property, TypeContainer } from '@core/EntitySchema';
import {
  Array as ArrayRenderer,
  Boolean as BooleanRenderer,
  Date as DateRenderer,
  DateTime,
  Enum,
  ForeignEntity,
  Html,
  Time,
} from '@components/Common/Renderers';

function container(type: string, extra: Partial<TypeContainer> = {}): TypeContainer {
  return { type, ...extra };
}

function mockProperty(overrides: Partial<Property> = {}): Property {
  return { id: 'test', type: 'string', owner: 'test_entity', ...overrides } as Property;
}

describe('CellRendererManager', () => {
  afterEach(() => {
    _resetForTesting();
  });

  describe('getTypeRenderer', () => {
    it('returns null for string type', () => {
      expect(getTypeRenderer(container('string'))).toBeNull();
    });

    it('returns null for integer type', () => {
      expect(getTypeRenderer(container('integer'))).toBeNull();
    });

    it('returns null for float type', () => {
      expect(getTypeRenderer(container('float'))).toBeNull();
    });

    it('returns Enum component for enum type', () => {
      expect(getTypeRenderer(container('string', { enum: 'status' }))).toBe(Enum);
    });

    it('returns Html component for html type', () => {
      expect(getTypeRenderer(container('html'))).toBe(Html);
    });

    it('returns DateRenderer component for date type', () => {
      expect(getTypeRenderer(container('date'))).toBe(DateRenderer);
    });

    it('returns DateTime component for datetime type', () => {
      expect(getTypeRenderer(container('datetime'))).toBe(DateTime);
    });

    it('returns Time component for time type', () => {
      expect(getTypeRenderer(container('time'))).toBe(Time);
    });

    it('returns BooleanRenderer component for boolean type', () => {
      expect(getTypeRenderer(container('boolean'))).toBe(BooleanRenderer);
    });

    it('returns ForeignEntity component for relationship type', () => {
      expect(getTypeRenderer(container('relationship'))).toBe(ForeignEntity);
    });

    it('returns ArrayRenderer component for array type', () => {
      expect(getTypeRenderer(container('array'))).toBe(ArrayRenderer);
    });

    it('returns null for unknown type (falls back via nullish coalescing)', () => {
      expect(getTypeRenderer(container('unknown_type'))).toBeNull();
    });

    it('prioritizes enum over base type when enum is set', () => {
      // Even if the base type is "integer", having enum set means it returns Enum
      expect(getTypeRenderer(container('integer', { enum: 'priority' }))).toBe(Enum);
    });
  });

  describe('getPropertyRenderer', () => {
    it('falls back to type renderer when no property renderer is registered', () => {
      const property = mockProperty({ type: 'date' });
      expect(getPropertyRenderer(property)).toBe(DateRenderer);
    });

    it('returns null for string type with no property renderer registered', () => {
      const property = mockProperty({ type: 'string' });
      expect(getPropertyRenderer(property)).toBeNull();
    });

    it('returns property-specific renderer when registered', () => {
      const CustomRenderer = defineComponent({ template: '<span />' });
      registerPropertyRenderers({
        test_entity: { name: CustomRenderer },
      });
      const property = mockProperty({ id: 'name', type: 'string', owner: 'test_entity' });
      expect(getPropertyRenderer(property)).toBe(CustomRenderer);
    });

    it('returns type renderer for properties not in the property renderer map', () => {
      const CustomRenderer = defineComponent({ template: '<span />' });
      registerPropertyRenderers({
        test_entity: { name: CustomRenderer },
      });
      const property = mockProperty({ id: 'email', type: 'string', owner: 'test_entity' });
      expect(getPropertyRenderer(property)).toBeNull();
    });

    it('returns type renderer when entity is not in the property renderer map', () => {
      const CustomRenderer = defineComponent({ template: '<span />' });
      registerPropertyRenderers({
        other_entity: { name: CustomRenderer },
      });
      const property = mockProperty({ id: 'name', type: 'boolean', owner: 'test_entity' });
      expect(getPropertyRenderer(property)).toBe(BooleanRenderer);
    });

    it('supports render functions as property renderers', () => {
      const renderFn = (value: unknown) => String(value);
      registerPropertyRenderers({
        test_entity: { status: renderFn },
      });
      const property = mockProperty({ id: 'status', type: 'string', owner: 'test_entity' });
      expect(getPropertyRenderer(property)).toBe(renderFn);
    });

    it('falls back to type renderer when property renderer is null (nullish coalescing)', () => {
      registerPropertyRenderers({
        test_entity: { created_at: null },
      });
      const property = mockProperty({ id: 'created_at', type: 'datetime', owner: 'test_entity' });
      // null ?? getTypeRenderer(property) falls through to the type renderer
      expect(getPropertyRenderer(property)).toBe(DateTime);
    });
  });

  describe('registerTypeRenderers', () => {
    it('overrides default type renderers', () => {
      const CustomDate = defineComponent({ template: '<div />' });
      registerTypeRenderers({ date: CustomDate });
      expect(getTypeRenderer(container('date'))).toBe(CustomDate);
    });

    it('sets a renderer for a previously null type', () => {
      const CustomString = defineComponent({ template: '<span />' });
      registerTypeRenderers({ string: CustomString });
      expect(getTypeRenderer(container('string'))).toBe(CustomString);
    });

    it('allows setting a renderer to null', () => {
      registerTypeRenderers({ boolean: null });
      expect(getTypeRenderer(container('boolean'))).toBeNull();
    });

    it('allows setting a render function as type renderer', () => {
      const renderFn = (value: unknown) => `formatted: ${value}`;
      registerTypeRenderers({ integer: renderFn });
      expect(getTypeRenderer(container('integer'))).toBe(renderFn);
    });

    it('does not affect unregistered types', () => {
      const CustomDate = defineComponent({ template: '<div />' });
      registerTypeRenderers({ date: CustomDate });
      // Other types remain unchanged
      expect(getTypeRenderer(container('datetime'))).toBe(DateTime);
      expect(getTypeRenderer(container('boolean'))).toBe(BooleanRenderer);
      expect(getTypeRenderer(container('string'))).toBeNull();
    });
  });

  describe('registerPropertyRenderers', () => {
    it('registers renderers keyed by entity and property id', () => {
      const CustomRenderer = defineComponent({ template: '<div />' });
      registerPropertyRenderers({
        user: { avatar: CustomRenderer },
      });
      const property = mockProperty({ id: 'avatar', type: 'string', owner: 'user' });
      expect(getPropertyRenderer(property)).toBe(CustomRenderer);
    });

    it('supports multiple entities', () => {
      const UserRenderer = defineComponent({ template: '<span>user</span>' });
      const OrderRenderer = defineComponent({ template: '<span>order</span>' });
      registerPropertyRenderers({
        user: { name: UserRenderer },
        order: { name: OrderRenderer },
      });
      expect(getPropertyRenderer(mockProperty({ id: 'name', owner: 'user' }))).toBe(UserRenderer);
      expect(getPropertyRenderer(mockProperty({ id: 'name', owner: 'order' }))).toBe(OrderRenderer);
    });

    it('supports multiple properties per entity', () => {
      const RendererA = defineComponent({ template: '<span>a</span>' });
      const RendererB = defineComponent({ template: '<span>b</span>' });
      registerPropertyRenderers({
        user: { first_name: RendererA, last_name: RendererB },
      });
      expect(getPropertyRenderer(mockProperty({ id: 'first_name', owner: 'user' }))).toBe(RendererA);
      expect(getPropertyRenderer(mockProperty({ id: 'last_name', owner: 'user' }))).toBe(RendererB);
    });

    it('merges with existing property renderers on subsequent calls', () => {
      const RendererA = defineComponent({ template: '<span>a</span>' });
      const RendererB = defineComponent({ template: '<span>b</span>' });
      registerPropertyRenderers({ user: { name: RendererA } });
      registerPropertyRenderers({ order: { total: RendererB } });
      expect(getPropertyRenderer(mockProperty({ id: 'name', owner: 'user' }))).toBe(RendererA);
      expect(getPropertyRenderer(mockProperty({ id: 'total', owner: 'order' }))).toBe(RendererB);
    });
  });

  describe('_resetForTesting', () => {
    it('restores default type renderers after override', () => {
      const Custom = defineComponent({ template: '<div />' });
      registerTypeRenderers({ date: Custom });
      expect(getTypeRenderer(container('date'))).toBe(Custom);

      _resetForTesting();
      expect(getTypeRenderer(container('date'))).toBe(DateRenderer);
    });

    it('removes custom type renderers for types that previously had null', () => {
      const Custom = defineComponent({ template: '<div />' });
      registerTypeRenderers({ string: Custom });
      expect(getTypeRenderer(container('string'))).toBe(Custom);

      _resetForTesting();
      expect(getTypeRenderer(container('string'))).toBeNull();
    });

    it('clears all property renderers', () => {
      const Custom = defineComponent({ template: '<div />' });
      registerPropertyRenderers({ user: { name: Custom } });
      expect(getPropertyRenderer(mockProperty({ id: 'name', owner: 'user' }))).toBe(Custom);

      _resetForTesting();
      // Falls back to type renderer (null for string)
      expect(getPropertyRenderer(mockProperty({ id: 'name', type: 'string', owner: 'user' }))).toBeNull();
    });

    it('restores all default renderers to their original values', () => {
      _resetForTesting();

      expect(getTypeRenderer(container('string'))).toBeNull();
      expect(getTypeRenderer(container('integer'))).toBeNull();
      expect(getTypeRenderer(container('float'))).toBeNull();
      expect(getTypeRenderer(container('string', { enum: 'x' }))).toBe(Enum);
      expect(getTypeRenderer(container('html'))).toBe(Html);
      expect(getTypeRenderer(container('date'))).toBe(DateRenderer);
      expect(getTypeRenderer(container('datetime'))).toBe(DateTime);
      expect(getTypeRenderer(container('time'))).toBe(Time);
      expect(getTypeRenderer(container('boolean'))).toBe(BooleanRenderer);
      expect(getTypeRenderer(container('relationship'))).toBe(ForeignEntity);
      expect(getTypeRenderer(container('array'))).toBe(ArrayRenderer);
    });
  });
});
