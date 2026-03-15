import { describe, it, expect } from 'vitest';
import { useFilterWithOperator } from '@components/Filter/Composable/FilterWithOperator';
import type { EntitySchema, Property } from '@core/EntitySchema';
import type { ConditionFilter, GroupFilter, EntityConditionFilter } from '@core/types';
import { defaultBuilderConfig } from '@tests/helpers/provideConfig';

function mockProperty(overrides: Partial<Property> = {}): Property {
  return { id: 'test', type: 'string', owner: 'user', ...overrides } as Property;
}

function mockEntitySchema(properties: Record<string, Property> = {}): EntitySchema {
  return {
    id: 'user',
    getProperty(name: string) {
      const prop = properties[name];
      if (!prop) throw new Error(`Property ${name} not found`);
      return prop;
    },
  } as EntitySchema;
}

function makeCondition(overrides: Partial<ConditionFilter> = {}): ConditionFilter {
  return { type: 'condition', property: 'first_name', operator: '=', ...overrides };
}

function makeGroup(overrides: Partial<GroupFilter> = {}): GroupFilter {
  return { type: 'group', operator: 'and', filters: [], ...overrides };
}

function makeEntityCondition(overrides: Partial<EntityConditionFilter> = {}): EntityConditionFilter {
  return { type: 'entity_condition', property: 'company', operator: 'has', ...overrides };
}

describe('useFilterWithOperator', () => {
  describe('isRemovable', () => {
    it('is true by default', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const { isRemovable } = useFilterWithOperator(defaultBuilderConfig(), {
        entitySchema: schema,
        modelValue: makeCondition(),
      });
      expect(isRemovable.value).toBe(true);
    });

    it('is false when removable is explicitly false', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const { isRemovable } = useFilterWithOperator(defaultBuilderConfig(), {
        entitySchema: schema,
        modelValue: makeCondition({ removable: false }),
      });
      expect(isRemovable.value).toBe(false);
    });

    it('is true when removable is undefined', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const { isRemovable } = useFilterWithOperator(defaultBuilderConfig(), {
        entitySchema: schema,
        modelValue: makeCondition({ removable: undefined }),
      });
      expect(isRemovable.value).toBe(true);
    });
  });

  describe('isEditable', () => {
    it('is true by default', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const { isEditable } = useFilterWithOperator(defaultBuilderConfig(), {
        entitySchema: schema,
        modelValue: makeCondition(),
      });
      expect(isEditable.value).toBe(true);
    });

    it('is false when editable is explicitly false', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const { isEditable } = useFilterWithOperator(defaultBuilderConfig(), {
        entitySchema: schema,
        modelValue: makeCondition({ editable: false }),
      });
      expect(isEditable.value).toBe(false);
    });
  });

  describe('operatorOptions', () => {
    it('uses getConditionOperators for condition filters', () => {
      const prop = mockProperty({ id: 'first_name' });
      const schema = mockEntitySchema({ first_name: prop });
      const config = defaultBuilderConfig({ allowedOperators: { condition: { string: ['=', '<>'] } } });
      const { operatorOptions } = useFilterWithOperator(config, {
        entitySchema: schema,
        modelValue: makeCondition(),
      });

      expect(operatorOptions.value).toEqual([
        { label: '=', value: '=' },
        { label: '≠', value: '<>' },
      ]);
    });

    it('uses getContainerOperators for group filters', () => {
      const schema = mockEntitySchema();
      const { operatorOptions } = useFilterWithOperator(defaultBuilderConfig(), {
        entitySchema: schema,
        modelValue: makeGroup(),
      });

      expect(operatorOptions.value).toEqual([
        { label: 'and', value: 'and' },
        { label: 'or', value: 'or' },
      ]);
    });

    it('uses getContainerOperators for entity_condition filters', () => {
      const schema = mockEntitySchema();
      const { operatorOptions } = useFilterWithOperator(defaultBuilderConfig(), {
        entitySchema: schema,
        modelValue: makeEntityCondition(),
      });

      expect(operatorOptions.value).toEqual([
        { label: 'has', value: 'has' },
        { label: "doesn't have", value: 'has_not' },
      ]);
    });

    it('adds current operator if not in available options', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const config = defaultBuilderConfig({ allowedOperators: { condition: { string: ['=', '<>'] } } });
      const { operatorOptions } = useFilterWithOperator(config, {
        entitySchema: schema,
        modelValue: makeCondition({ operator: 'like' }),
      });

      expect(operatorOptions.value).toHaveLength(3);
      expect(operatorOptions.value[2]).toEqual({ label: 'contains', value: 'like' });
    });

    it('does not duplicate current operator if already in options', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const config = defaultBuilderConfig({ allowedOperators: { condition: { string: ['=', '<>'] } } });
      const { operatorOptions } = useFilterWithOperator(config, {
        entitySchema: schema,
        modelValue: makeCondition({ operator: '=' }),
      });

      expect(operatorOptions.value).toHaveLength(2);
    });

    it('passes allowedOperators from config', () => {
      const config = defaultBuilderConfig({ allowedOperators: { condition: { string: ['='] } } });
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const { operatorOptions } = useFilterWithOperator(config, {
        entitySchema: schema,
        modelValue: makeCondition(),
      });

      expect(operatorOptions.value).toEqual([{ label: '=', value: '=' }]);
    });
  });

  describe('aliasInsensitiveLabels', () => {
    it('defaults to false and shows (A=a) labels for insensitive operators', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const config = defaultBuilderConfig({
        allowedOperators: { condition: { string: ['like', 'ilike', 'begins_with', 'ibegins_with', 'ends_with', 'iends_with'] } },
      });
      expect(config.aliasInsensitiveLabels).toBe(false);
      const { operatorOptions } = useFilterWithOperator(config, {
        entitySchema: schema,
        modelValue: makeCondition({ operator: 'ilike' }),
      });

      const labels = Object.fromEntries(operatorOptions.value.map((o) => [o.value, o.label]));
      // case-sensitive: no (A=a)
      expect(labels['like']).toBe('contains');
      expect(labels['begins_with']).toBe('begins with');
      expect(labels['ends_with']).toBe('ends with');
      // case-insensitive: has (A=a)
      expect(labels['ilike']).toBe('contains (A=a)');
      expect(labels['ibegins_with']).toBe('begins with (A=a)');
      expect(labels['iends_with']).toBe('ends with (A=a)');
    });

    it('aliases all insensitive operator labels to their sensitive counterparts when true', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const config = defaultBuilderConfig({
        aliasInsensitiveLabels: true,
        allowedOperators: { condition: { string: ['ilike', 'not_ilike', 'ibegins_with', 'idoesnt_begin_with', 'iends_with', 'idoesnt_end_with'] } },
      });
      const { operatorOptions } = useFilterWithOperator(config, {
        entitySchema: schema,
        modelValue: makeCondition({ operator: 'ilike' }),
      });

      const labels = Object.fromEntries(operatorOptions.value.map((o) => [o.value, o.label]));
      expect(labels['ilike']).toBe('contains');
      expect(labels['not_ilike']).toBe("doesn't contain");
      expect(labels['ibegins_with']).toBe('begins with');
      expect(labels['idoesnt_begin_with']).toBe("doesn't begin with");
      expect(labels['iends_with']).toBe('ends with');
      expect(labels['idoesnt_end_with']).toBe("doesn't end with");
    });

    it('does not affect non-insensitive operators when true', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const config = defaultBuilderConfig({
        aliasInsensitiveLabels: true,
        allowedOperators: { condition: { string: ['=', '<>', 'like', 'not_like'] } },
      });
      const { operatorOptions } = useFilterWithOperator(config, {
        entitySchema: schema,
        modelValue: makeCondition(),
      });

      const labels = Object.fromEntries(operatorOptions.value.map((o) => [o.value, o.label]));
      expect(labels['=']).toBe('=');
      expect(labels['<>']).toBe('≠');
      expect(labels['like']).toBe('contains');
      expect(labels['not_like']).toBe("doesn't contain");
    });

    it('aliases fallback operator label when current operator is not in allowed list', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const config = defaultBuilderConfig({
        aliasInsensitiveLabels: true,
        allowedOperators: { condition: { string: ['='] } },
      });
      const { operatorOptions } = useFilterWithOperator(config, {
        entitySchema: schema,
        modelValue: makeCondition({ operator: 'ilike' }),
      });

      const ilikeOption = operatorOptions.value.find((o) => o.value === 'ilike')!;
      expect(ilikeOption.label).toBe('contains');
    });
  });

  describe('canEditOperator', () => {
    it('is true when editable and multiple operators', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const { canEditOperator } = useFilterWithOperator(defaultBuilderConfig(), {
        entitySchema: schema,
        modelValue: makeCondition(),
      });
      expect(canEditOperator.value).toBe(true);
    });

    it('is false when only one operator', () => {
      const config = defaultBuilderConfig({ allowedOperators: { condition: { string: ['='] } } });
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const { canEditOperator } = useFilterWithOperator(config, {
        entitySchema: schema,
        modelValue: makeCondition(),
      });
      expect(canEditOperator.value).toBe(false);
    });

    it('is false when not editable even with multiple operators', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const { canEditOperator } = useFilterWithOperator(defaultBuilderConfig(), {
        entitySchema: schema,
        modelValue: makeCondition({ editable: false }),
      });
      expect(canEditOperator.value).toBe(false);
    });
  });
});
