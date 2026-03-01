import { describe, it, expect } from 'vitest';

import { getUniqueId, getNestedValue } from '@core/Utils';

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
});
