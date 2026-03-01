import { describe, it, expect } from 'vitest';
import { useFilterWithOperator } from '@components/Filter/Composable/FilterWithOperator';
import type { EntitySchema, Property } from '@core/EntitySchema';
import type { ConditionFilter, GroupFilter, RelationshipConditionFilter, BuilderConfig } from '@core/types';

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

function makeRelationshipCondition(overrides: Partial<RelationshipConditionFilter> = {}): RelationshipConditionFilter {
  return { type: 'relationship_condition', property: 'company', operator: 'has', ...overrides };
}

describe('useFilterWithOperator', () => {
  describe('isRemovable', () => {
    it('is true by default', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const { isRemovable } = useFilterWithOperator({}, {
        entitySchema: schema,
        modelValue: makeCondition(),
      });
      expect(isRemovable.value).toBe(true);
    });

    it('is false when removable is explicitly false', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const { isRemovable } = useFilterWithOperator({}, {
        entitySchema: schema,
        modelValue: makeCondition({ removable: false }),
      });
      expect(isRemovable.value).toBe(false);
    });

    it('is true when removable is undefined', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const { isRemovable } = useFilterWithOperator({}, {
        entitySchema: schema,
        modelValue: makeCondition({ removable: undefined }),
      });
      expect(isRemovable.value).toBe(true);
    });
  });

  describe('isEditable', () => {
    it('is true by default', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const { isEditable } = useFilterWithOperator({}, {
        entitySchema: schema,
        modelValue: makeCondition(),
      });
      expect(isEditable.value).toBe(true);
    });

    it('is false when editable is explicitly false', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const { isEditable } = useFilterWithOperator({}, {
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
      const config: BuilderConfig = { allowedOperators: { condition: { string: ['=', '<>'] } } };
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
      const { operatorOptions } = useFilterWithOperator({}, {
        entitySchema: schema,
        modelValue: makeGroup(),
      });

      expect(operatorOptions.value).toEqual([
        { label: 'and', value: 'and' },
        { label: 'or', value: 'or' },
      ]);
    });

    it('uses getContainerOperators for relationship_condition filters', () => {
      const schema = mockEntitySchema();
      const { operatorOptions } = useFilterWithOperator({}, {
        entitySchema: schema,
        modelValue: makeRelationshipCondition(),
      });

      expect(operatorOptions.value).toEqual([
        { label: 'has', value: 'has' },
        { label: "doesn't have", value: 'has_not' },
      ]);
    });

    it('adds current operator if not in available options', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const config: BuilderConfig = { allowedOperators: { condition: { string: ['=', '<>'] } } };
      const { operatorOptions } = useFilterWithOperator(config, {
        entitySchema: schema,
        modelValue: makeCondition({ operator: 'like' }),
      });

      expect(operatorOptions.value).toHaveLength(3);
      expect(operatorOptions.value[2]).toEqual({ label: 'contains', value: 'like' });
    });

    it('does not duplicate current operator if already in options', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const config: BuilderConfig = { allowedOperators: { condition: { string: ['=', '<>'] } } };
      const { operatorOptions } = useFilterWithOperator(config, {
        entitySchema: schema,
        modelValue: makeCondition({ operator: '=' }),
      });

      expect(operatorOptions.value).toHaveLength(2);
    });

    it('passes allowedOperators from config', () => {
      const config: BuilderConfig = { allowedOperators: { condition: { string: ['='] } } };
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const { operatorOptions } = useFilterWithOperator(config, {
        entitySchema: schema,
        modelValue: makeCondition(),
      });

      expect(operatorOptions.value).toEqual([{ label: '=', value: '=' }]);
    });
  });

  describe('canEditOperator', () => {
    it('is true when editable and multiple operators', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const { canEditOperator } = useFilterWithOperator({}, {
        entitySchema: schema,
        modelValue: makeCondition(),
      });
      expect(canEditOperator.value).toBe(true);
    });

    it('is false when only one operator', () => {
      const config: BuilderConfig = { allowedOperators: { condition: { string: ['='] } } };
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const { canEditOperator } = useFilterWithOperator(config, {
        entitySchema: schema,
        modelValue: makeCondition(),
      });
      expect(canEditOperator.value).toBe(false);
    });

    it('is false when not editable even with multiple operators', () => {
      const schema = mockEntitySchema({ first_name: mockProperty() });
      const { canEditOperator } = useFilterWithOperator({}, {
        entitySchema: schema,
        modelValue: makeCondition({ editable: false }),
      });
      expect(canEditOperator.value).toBe(false);
    });
  });
});
