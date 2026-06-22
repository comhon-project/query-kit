import { describe, it, expect } from 'vitest';
import { normalizeFilter, prepareFilters, stripKeys } from '@core/filterNormalize';
import type { ConditionFilter, Filter, GroupFilter } from '@core/types';

describe('filterNormalize', () => {
  describe('prepareFilters', () => {
    it('assigns a key to every node lacking one', () => {
      const filter: GroupFilter = {
        type: 'group',
        operator: 'and',
        filters: [
          { type: 'condition', property: 'first_name', operator: '=', value: 'Alice' },
          {
            type: 'group',
            operator: 'or',
            filters: [{ type: 'condition', property: 'last_name', operator: '=', value: 'Smith' }],
          },
        ],
      };
      prepareFilters(filter);
      expect(filter.key).toBeDefined();
      expect(filter.filters[0].key).toBeDefined();
      expect(filter.filters[1].key).toBeDefined();
      expect((filter.filters[1] as GroupFilter).filters[0].key).toBeDefined();
    });

    it('preserves keys that are already set (idempotent)', () => {
      const filter: GroupFilter = {
        type: 'group',
        operator: 'and',
        key: 'root-key',
        filters: [
          { type: 'condition', property: 'first_name', operator: '=', value: 'Alice', key: 'cond-1' },
        ],
      };
      prepareFilters(filter);
      expect(filter.key).toBe('root-key');
      expect(filter.filters[0].key).toBe('cond-1');
    });

    it('only assigns keys to nodes that lack them, leaving the rest alone', () => {
      const filter: GroupFilter = {
        type: 'group',
        operator: 'and',
        key: 'root',
        filters: [
          { type: 'condition', property: 'a', operator: '=', value: 1 },
          { type: 'condition', property: 'b', operator: '=', value: 2, key: 'b-key' },
        ],
      };
      prepareFilters(filter);
      expect(filter.key).toBe('root');
      expect(filter.filters[0].key).toBeDefined();
      expect(filter.filters[0].key).not.toBe('b-key');
      expect(filter.filters[1].key).toBe('b-key');
    });

    it('recurses into entity_condition.filter', () => {
      const filter: Filter = {
        type: 'entity_condition',
        operator: 'has',
        property: 'company',
        filter: { type: 'condition', property: 'brand_name', operator: '=', value: 'Acme' },
      };
      prepareFilters(filter);
      expect(filter.key).toBeDefined();
      expect((filter as { filter?: Filter }).filter!.key).toBeDefined();
    });
  });

  describe('stripKeys', () => {
    it('returns a deep clone with all keys removed', () => {
      const filter: GroupFilter = {
        type: 'group',
        operator: 'and',
        key: 'root',
        filters: [
          { type: 'condition', property: 'first_name', operator: '=', value: 'Alice', key: 'k1' },
          {
            type: 'group',
            operator: 'or',
            key: 'k2',
            filters: [{ type: 'condition', property: 'last_name', operator: '=', value: 'Smith', key: 'k3' }],
          },
        ],
      };
      const stripped = stripKeys(filter);
      expect(stripped.key).toBeUndefined();
      expect(stripped.filters[0].key).toBeUndefined();
      expect(stripped.filters[1].key).toBeUndefined();
      expect((stripped.filters[1] as GroupFilter).filters[0].key).toBeUndefined();
    });

    it('does not mutate the original input', () => {
      const filter: GroupFilter = {
        type: 'group',
        operator: 'and',
        key: 'root',
        filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice', key: 'k1' }],
      };
      stripKeys(filter);
      expect(filter.key).toBe('root');
      expect(filter.filters[0].key).toBe('k1');
    });

    it('preserves non-key fields like removable and editable', () => {
      const filter: GroupFilter = {
        type: 'group',
        operator: 'and',
        key: 'root',
        removable: false,
        editable: true,
        filters: [],
      };
      const stripped = stripKeys(filter);
      expect(stripped.removable).toBe(false);
      expect(stripped.editable).toBe(true);
    });
  });

  describe('normalizeFilter', () => {
    it('wraps a non-group filter into a Group', () => {
      const condition: ConditionFilter = { type: 'condition', property: 'first_name', operator: '=', value: 'Alice' };
      const result = normalizeFilter(condition);
      expect(result.type).toBe('group');
      expect(result.filters).toHaveLength(1);
      expect(result.filters[0]).toEqual(expect.objectContaining({ property: 'first_name', value: 'Alice' }));
    });

    it('wraps null into an empty Group', () => {
      const result = normalizeFilter(null);
      expect(result.type).toBe('group');
      expect(result.filters).toEqual([]);
      expect(result.operator).toBe('and');
    });

    it('preserves an already-Group filter (deep clone, same shape)', () => {
      const group: GroupFilter = {
        type: 'group',
        operator: 'or',
        filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }],
      };
      const result = normalizeFilter(group);
      expect(result).not.toBe(group); // cloned
      expect(result.operator).toBe('or');
      expect(result.filters).toHaveLength(1);
    });

    it('marks the top-level group as non-removable', () => {
      const result = normalizeFilter(null);
      expect(result.removable).toBe(false);
    });

    it('assigns keys to every node in the result', () => {
      const result = normalizeFilter({
        type: 'condition',
        property: 'first_name',
        operator: '=',
        value: 'Alice',
      });
      expect(result.key).toBeDefined();
      expect(result.filters[0].key).toBeDefined();
    });

    it('uses the first allowed group operator when wrapping (allowedOperators)', () => {
      const result = normalizeFilter(null, { group: ['or'] });
      expect(result.operator).toBe('or');
    });

    it('falls back to "and" when no allowedOperators specified', () => {
      const result = normalizeFilter(null);
      expect(result.operator).toBe('and');
    });

    it('does not mutate the input', () => {
      const condition: ConditionFilter = { type: 'condition', property: 'first_name', operator: '=', value: 'Alice' };
      normalizeFilter(condition);
      expect((condition as { key?: unknown }).key).toBeUndefined();
    });
  });
});
