import { describe, it, expect, beforeEach } from 'vitest';
import { computeFilter } from '@core/computeFilter';
import { registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { registerComputedScopes } from '@core/ComputedScopesManager';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import type {
  ConditionFilter,
  GroupFilter,
  ScopeFilter,
  EntityConditionFilter,
} from '@core/types';

beforeEach(() => {
  registerLoader(entitySchemaLoader);
  registerTranslationsLoader(entityTranslationsLoader);
  registerRequestLoader(requestSchemaLoader);
});

function makeGroup(filters: GroupFilter['filters']): GroupFilter {
  return { type: 'group', operator: 'and', filters };
}

describe('computeFilter', () => {
  describe('condition transformations', () => {
    it('removes empty conditions (value=undefined)', async () => {
      const result = await computeFilter(
        makeGroup([
          { type: 'condition', property: 'first_name', operator: '=', value: 'Alice' },
          { type: 'condition', property: 'last_name', operator: '=', value: undefined },
        ]),
        'user',
      );
      expect(result.filters).toHaveLength(1);
      expect(result.filters[0]).toEqual(expect.objectContaining({ property: 'first_name', value: 'Alice' }));
    });

    it('wraps like operator value with %', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'condition', property: 'first_name', operator: 'like', value: 'test' }]),
        'user',
      );
      const condition = result.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('like');
      expect(condition.value).toBe('%test%');
    });

    it('wraps not_like operator value with %', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'condition', property: 'first_name', operator: 'not_like', value: 'test' }]),
        'user',
      );
      const condition = result.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('not_like');
      expect(condition.value).toBe('%test%');
    });

    it('wraps ilike operator value with %', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'condition', property: 'first_name', operator: 'ilike', value: 'test' }]),
        'user',
      );
      const condition = result.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('ilike');
      expect(condition.value).toBe('%test%');
    });

    it('wraps not_ilike operator value with %', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'condition', property: 'first_name', operator: 'not_ilike', value: 'test' }]),
        'user',
      );
      const condition = result.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('not_ilike');
      expect(condition.value).toBe('%test%');
    });

    it('converts begins_with to like with trailing %', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'condition', property: 'first_name', operator: 'begins_with', value: 'Al' }]),
        'user',
      );
      const condition = result.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('like');
      expect(condition.value).toBe('Al%');
    });

    it('converts ends_with to like with leading %', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'condition', property: 'first_name', operator: 'ends_with', value: 'ice' }]),
        'user',
      );
      const condition = result.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('like');
      expect(condition.value).toBe('%ice');
    });

    it('converts doesnt_begin_with to not_like with trailing %', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'condition', property: 'first_name', operator: 'doesnt_begin_with', value: 'Al' }]),
        'user',
      );
      const condition = result.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('not_like');
      expect(condition.value).toBe('Al%');
    });

    it('converts doesnt_end_with to not_like with leading %', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'condition', property: 'first_name', operator: 'doesnt_end_with', value: 'ice' }]),
        'user',
      );
      const condition = result.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('not_like');
      expect(condition.value).toBe('%ice');
    });

    it('converts ibegins_with to ilike with trailing %', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'condition', property: 'first_name', operator: 'ibegins_with', value: 'Al' }]),
        'user',
      );
      const condition = result.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('ilike');
      expect(condition.value).toBe('Al%');
    });

    it('converts idoesnt_begin_with to not_ilike with trailing %', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'condition', property: 'first_name', operator: 'idoesnt_begin_with', value: 'Al' }]),
        'user',
      );
      const condition = result.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('not_ilike');
      expect(condition.value).toBe('Al%');
    });

    it('converts iends_with to ilike with leading %', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'condition', property: 'first_name', operator: 'iends_with', value: 'ice' }]),
        'user',
      );
      const condition = result.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('ilike');
      expect(condition.value).toBe('%ice');
    });

    it('converts idoesnt_end_with to not_ilike with leading %', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'condition', property: 'first_name', operator: 'idoesnt_end_with', value: 'ice' }]),
        'user',
      );
      const condition = result.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('not_ilike');
      expect(condition.value).toBe('%ice');
    });

    it('converts null operator to = with null value', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'condition', property: 'first_name', operator: 'null', value: undefined }]),
        'user',
      );
      const condition = result.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('=');
      expect(condition.value).toBeNull();
    });

    it('converts not_null operator to <> with null value', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'condition', property: 'first_name', operator: 'not_null', value: undefined }]),
        'user',
      );
      const condition = result.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('<>');
      expect(condition.value).toBeNull();
    });

    it('keeps conditions with null/not_null operator even without value', async () => {
      const result = await computeFilter(
        makeGroup([
          { type: 'condition', property: 'first_name', operator: 'null', value: undefined },
          { type: 'condition', property: 'last_name', operator: 'not_null', value: undefined },
        ]),
        'user',
      );
      expect(result.filters).toHaveLength(2);
    });

    it('passes contains operator with array value through without transformation', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'condition', property: 'favorite_fruits', operator: 'contains', value: ['apple', 'banana'] }]),
        'user',
      );
      const condition = result.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('contains');
      expect(condition.value).toEqual(['apple', 'banana']);
    });

    it('passes not_contains operator with array value through without transformation', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'condition', property: 'favorite_fruits', operator: 'not_contains', value: ['banana'] }]),
        'user',
      );
      const condition = result.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('not_contains');
      expect(condition.value).toEqual(['banana']);
    });
  });

  describe('array value filtering', () => {
    it('filters undefined values from array condition values', async () => {
      const result = await computeFilter(
        makeGroup([
          { type: 'condition', property: 'favorite_fruits', operator: 'in', value: ['apple', undefined, 'banana'] },
        ]),
        'user',
      );
      const condition = result.filters[0] as ConditionFilter;
      expect(condition.value).toEqual(['apple', 'banana']);
    });

    it('filters undefined values from contains array values', async () => {
      const result = await computeFilter(
        makeGroup([
          { type: 'condition', property: 'favorite_fruits', operator: 'contains', value: ['apple', undefined, 'banana'] },
        ]),
        'user',
      );
      const condition = result.filters[0] as ConditionFilter;
      expect(condition.value).toEqual(['apple', 'banana']);
    });
  });

  describe('key/editable/removable stripping', () => {
    it('strips keys from output', async () => {
      const result = await computeFilter(
        {
          type: 'group',
          operator: 'and',
          key: 1,
          filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice', key: 2 }],
        },
        'user',
      );
      expect(result.key).toBeUndefined();
      for (const child of result.filters) {
        expect(child.key).toBeUndefined();
      }
    });

    it('strips editable and removable from output', async () => {
      const result = await computeFilter(
        {
          type: 'group',
          operator: 'and',
          editable: true,
          removable: false,
          filters: [
            {
              type: 'condition',
              property: 'first_name',
              operator: '=',
              value: 'Alice',
              editable: true,
              removable: true,
            },
          ],
        },
        'user',
      );
      expect(result.editable).toBeUndefined();
      expect(result.removable).toBeUndefined();
      for (const child of result.filters) {
        expect(child.editable).toBeUndefined();
        expect(child.removable).toBeUndefined();
      }
    });
  });

  describe('computed scopes', () => {
    it('replaces a computed scope with the inline filter it returns', async () => {
      registerComputedScopes({
        user: [
          {
            id: 'test_computed',
            name: 'Test Computed',
            computed: (params: unknown[]) => ({
              type: 'condition',
              property: 'first_name',
              operator: '=',
              value: params[0] ?? 'default',
            }),
          },
        ],
      });

      const result = await computeFilter(
        makeGroup([{ type: 'scope', id: 'test_computed', parameters: ['Alice'] } as ScopeFilter]),
        'user',
      );
      expect(result.filters).toHaveLength(1);
      expect(result.filters[0]).toEqual(
        expect.objectContaining({
          type: 'condition',
          property: 'first_name',
          operator: '=',
          value: 'Alice',
        }),
      );
    });

    it('throws when a computed scope returns a non-object value', async () => {
      registerComputedScopes({
        user: [
          {
            id: 'bad_computed',
            name: 'Bad Computed',
            computed: () => 'not-an-object' as unknown as Record<string, unknown>,
          },
        ],
      });

      await expect(
        computeFilter(
          makeGroup([{ type: 'scope', id: 'bad_computed', parameters: [] } as ScopeFilter]),
          'user',
        ),
      ).rejects.toThrow(/invalid computed value/);
    });
  });

  describe('scope parameter filtering', () => {
    it('filters undefined values from scope parameters arrays', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'scope', id: 'scope', parameters: [['a', undefined, 'b']] } as ScopeFilter]),
        'user',
      );
      const scope = result.filters[0] as ScopeFilter;
      expect(scope.parameters![0]).toEqual(['a', 'b']);
    });
  });

  describe('isScopeFilled', () => {
    it('removes scope with unfilled non-nullable parameter', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'scope', id: 'string_scope', parameters: [undefined] } as ScopeFilter]),
        'user',
      );
      expect(result.filters.find((f) => f.type === 'scope')).toBeUndefined();
    });

    it('keeps scope with filled non-nullable parameter', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'scope', id: 'string_scope', parameters: ['hello'] } as ScopeFilter]),
        'user',
      );
      const scope = result.filters.find((f) => f.type === 'scope') as ScopeFilter;
      expect(scope).toBeDefined();
      expect(scope.id).toBe('string_scope');
      expect(scope.parameters).toEqual(['hello']);
    });

    it('removes scope with empty array for non-nullable parameter', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'scope', id: 'string_scope', parameters: [[]] } as ScopeFilter]),
        'user',
      );
      expect(result.filters.find((f) => f.type === 'scope')).toBeUndefined();
    });

    it('removes scope with null non-nullable parameter', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'scope', id: 'string_scope', parameters: [null] } as ScopeFilter]),
        'user',
      );
      expect(result.filters.find((f) => f.type === 'scope')).toBeUndefined();
    });

    it('keeps scope with no parameters defined', async () => {
      const result = await computeFilter(
        makeGroup([{ type: 'scope', id: 'scope', parameters: [] } as ScopeFilter]),
        'user',
      );
      const scope = result.filters.find((f) => f.type === 'scope') as ScopeFilter;
      expect(scope).toBeDefined();
      expect(scope.id).toBe('scope');
    });
  });

  describe('empty group stripping', () => {
    it('strips an empty nested group from output', async () => {
      const result = await computeFilter(
        makeGroup([
          { type: 'condition', property: 'first_name', operator: '=', value: 'Alice' },
          { type: 'group', operator: 'or', filters: [] },
        ]),
        'user',
      );
      expect(result.filters).toHaveLength(1);
      expect(result.filters[0]).toMatchObject({ type: 'condition', property: 'first_name' });
    });

    it('strips a nested group containing only empty conditions from output', async () => {
      const result = await computeFilter(
        makeGroup([
          { type: 'condition', property: 'first_name', operator: '=', value: 'Alice' },
          {
            type: 'group',
            operator: 'or',
            filters: [{ type: 'condition', property: 'last_name', operator: '=', value: undefined }],
          },
        ]),
        'user',
      );
      expect(result.filters).toHaveLength(1);
      expect(result.filters[0]).toMatchObject({ type: 'condition', property: 'first_name' });
    });

    it('keeps a nested group that has at least one filled condition', async () => {
      const result = await computeFilter(
        makeGroup([
          {
            type: 'group',
            operator: 'or',
            filters: [{ type: 'condition', property: 'last_name', operator: '=', value: 'Smith' }],
          },
        ]),
        'user',
      );
      expect(result.filters).toHaveLength(1);
      expect(result.filters[0].type).toBe('group');
    });
  });

  describe('relationship conditions', () => {
    it('removes empty relationship-condition child filter', async () => {
      const result = await computeFilter(
        makeGroup([
          {
            type: 'entity_condition',
            operator: 'has',
            property: 'company',
            filter: { type: 'condition', property: 'brand_name', operator: '=', value: undefined },
          } as EntityConditionFilter,
        ]),
        'user',
      );
      const rc = result.filters[0] as EntityConditionFilter;
      expect(rc.filter).toBeUndefined();
    });

    it('keeps relationship-condition child filter with value', async () => {
      const result = await computeFilter(
        makeGroup([
          {
            type: 'entity_condition',
            operator: 'has',
            property: 'company',
            filter: { type: 'condition', property: 'brand_name', operator: '=', value: 'Acme' },
          } as EntityConditionFilter,
        ]),
        'user',
      );
      const rc = result.filters[0] as EntityConditionFilter;
      expect(rc.filter).toBeDefined();
      expect((rc.filter as ConditionFilter).value).toBe('Acme');
    });

    it('keeps relationship-condition with null/not_null operator even without child filter', async () => {
      const result = await computeFilter(
        makeGroup([
          {
            type: 'entity_condition',
            operator: 'has',
            property: 'company',
            filter: { type: 'condition', property: 'brand_name', operator: 'null', value: undefined },
          } as EntityConditionFilter,
        ]),
        'user',
      );
      const rc = result.filters[0] as EntityConditionFilter;
      expect(rc.filter).toBeDefined();
    });
  });

  describe('morph_to relationships', () => {
    it('throws when a morph_to relationship has a child filter but no entities', async () => {
      await expect(
        computeFilter(
          makeGroup([
            {
              type: 'entity_condition',
              operator: 'has',
              property: 'favorite_client',
              filter: { type: 'condition', property: 'first_name', operator: '=', value: 'Alice' },
            } as EntityConditionFilter,
          ]),
          'user',
        ),
      ).rejects.toThrow(/morph_to/);
    });

    it('resolves the intersection schema for a morph_to with entities and keeps a filled child filter', async () => {
      const result = await computeFilter(
        makeGroup([
          {
            type: 'entity_condition',
            operator: 'has',
            property: 'favorite_client',
            entities: ['user', 'organization'],
            filter: { type: 'condition', property: 'first_name', operator: '=', value: 'Alice' },
          } as EntityConditionFilter,
        ]),
        'user',
      );
      const rc = result.filters[0] as EntityConditionFilter;
      expect(rc.entities).toEqual(['user', 'organization']);
      expect(rc.filter).toBeDefined();
      expect((rc.filter as ConditionFilter).value).toBe('Alice');
    });
  });
});
