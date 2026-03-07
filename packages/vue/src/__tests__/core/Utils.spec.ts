import { describe, it, expect } from 'vitest';

import { getUniqueId, getNestedValue, deepEqual } from '@core/Utils';

describe('Utils', () => {
  describe('getUniqueId', () => {
    it('returns incrementing numbers on successive calls', () => {
      const first = getUniqueId();
      const second = getUniqueId();
      const third = getUniqueId();

      expect(second).toBe(first + 1);
      expect(third).toBe(second + 1);
    });

    it('never returns the same value twice', () => {
      const ids = new Set<number>();
      for (let i = 0; i < 50; i++) {
        ids.add(getUniqueId());
      }
      expect(ids.size).toBe(50);
    });
  });

  describe('getNestedValue', () => {
    it('returns value for a flat (non-nested) key', () => {
      const obj = { name: 'Alice', age: 30 };
      expect(getNestedValue(obj, 'name')).toBe('Alice');
      expect(getNestedValue(obj, 'age')).toBe(30);
    });

    it('returns value for a nested key (a.b)', () => {
      const obj = { user: { name: 'Bob' } };
      expect(getNestedValue(obj, 'user.name')).toBe('Bob');
    });

    it('returns value for a deeply nested key (a.b.c)', () => {
      const obj = { level1: { level2: { level3: 'deep' } } };
      expect(getNestedValue(obj, 'level1.level2.level3')).toBe('deep');
    });

    it('returns undefined when an intermediate value is null', () => {
      const obj = { user: null } as Record<string, unknown>;
      expect(getNestedValue(obj, 'user.name')).toBeUndefined();
    });

    it('returns undefined when an intermediate value is not an object', () => {
      const obj = { user: 42 } as Record<string, unknown>;
      expect(getNestedValue(obj, 'user.name')).toBeUndefined();
    });

    it('returns undefined for a missing flat key', () => {
      const obj = { name: 'Alice' };
      expect(getNestedValue(obj, 'missing')).toBeUndefined();
    });

    it('returns undefined for a missing nested key', () => {
      const obj = { user: { name: 'Alice' } };
      expect(getNestedValue(obj, 'user.email')).toBeUndefined();
    });
  });

  describe('deepEqual', () => {
    it('returns true for identical primitives', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual('a', 'a')).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(undefined, undefined)).toBe(true);
    });

    it('returns false for different primitives', () => {
      expect(deepEqual(1, 2)).toBe(false);
      expect(deepEqual('a', 'b')).toBe(false);
      expect(deepEqual(true, false)).toBe(false);
    });

    it('returns true for both NaN', () => {
      expect(deepEqual(NaN, NaN)).toBe(true);
    });

    it('returns false for NaN vs non-NaN', () => {
      expect(deepEqual(NaN, 1)).toBe(false);
      expect(deepEqual(1, NaN)).toBe(false);
    });

    it('returns false when one side is null and the other is an object', () => {
      expect(deepEqual(null, {})).toBe(false);
      expect(deepEqual({}, null)).toBe(false);
    });

    it('returns true for same object reference', () => {
      const obj = { a: 1 };
      expect(deepEqual(obj, obj)).toBe(true);
    });

    it('returns true for equal flat objects', () => {
      expect(deepEqual({ a: 1, b: 'x' }, { a: 1, b: 'x' })).toBe(true);
    });

    it('returns false for objects with different values', () => {
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('returns false for objects with different keys', () => {
      expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
    });

    it('returns false for objects with different key counts', () => {
      expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    });

    it('returns true for equal nested objects', () => {
      expect(deepEqual({ a: { b: { c: 42 } } }, { a: { b: { c: 42 } } })).toBe(true);
    });

    it('returns false for different nested objects', () => {
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
    });

    it('returns true for equal arrays', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    it('returns false for arrays with different values', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    it('returns false for arrays with different lengths', () => {
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it('returns true for equal arrays of objects', () => {
      expect(deepEqual([{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 2 }])).toBe(true);
    });

    it('returns false for arrays of objects with different content', () => {
      expect(deepEqual([{ a: 1 }], [{ a: 2 }])).toBe(false);
    });

    it('returns false when comparing an array to an object', () => {
      expect(deepEqual([], {})).toBe(false);
      expect(deepEqual({}, [])).toBe(false);
    });

    it('returns true for equal dates', () => {
      expect(deepEqual(new Date('2024-01-01'), new Date('2024-01-01'))).toBe(true);
    });

    it('returns false for different dates', () => {
      expect(deepEqual(new Date('2024-01-01'), new Date('2024-01-02'))).toBe(false);
    });

    it('returns false when comparing a date to a non-date object', () => {
      expect(deepEqual(new Date('2024-01-01'), { valueOf: () => new Date('2024-01-01').getTime() })).toBe(false);
    });

    it('returns false when comparing a primitive to an object', () => {
      expect(deepEqual(1, { a: 1 })).toBe(false);
      expect(deepEqual({ a: 1 }, 1)).toBe(false);
    });

    it('returns true for equal filter-like nested structures', () => {
      const a = { type: 'group', operator: 'and', filters: [{ type: 'condition', property: 'name', operator: 'eq', value: 'foo' }] };
      const b = { type: 'group', operator: 'and', filters: [{ type: 'condition', property: 'name', operator: 'eq', value: 'foo' }] };
      expect(deepEqual(a, b)).toBe(true);
    });

    it('returns false for filter-like structures with different values', () => {
      const a = { type: 'group', operator: 'and', filters: [{ type: 'condition', property: 'name', operator: 'eq', value: 'foo' }] };
      const b = { type: 'group', operator: 'and', filters: [{ type: 'condition', property: 'name', operator: 'eq', value: 'bar' }] };
      expect(deepEqual(a, b)).toBe(false);
    });

    it('returns false for filter-like structures with different number of filters', () => {
      const a = { type: 'group', operator: 'and', filters: [] };
      const b = { type: 'group', operator: 'and', filters: [{ type: 'condition', property: 'name', operator: 'eq', value: 'foo' }] };
      expect(deepEqual(a, b)).toBe(false);
    });
  });
});
