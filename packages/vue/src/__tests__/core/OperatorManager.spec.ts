import { describe, it, expect, afterEach } from 'vitest';

import {
  getConditionOperators,
  getContainerOperators,
  getOperatorTranslation,
  isValidOperator,
  registerOperators,
  _resetForTesting,
} from '@core/OperatorManager';
import type { Property } from '@core/EntitySchema';

function mockProperty(overrides: Partial<Property> = {}): Property {
  return { id: 'test', type: 'string', owner: 'test', ...overrides } as Property;
}

describe('OperatorManager', () => {
  afterEach(() => {
    _resetForTesting();
  });

  describe('getConditionOperators', () => {
    it('returns basic operators for string type', () => {
      const ops = getConditionOperators(mockProperty({ type: 'string' }));
      expect(ops).toContain('=');
      expect(ops).toContain('<>');
      expect(ops).toContain('like');
      expect(ops).toContain('not_like');
      expect(ops).toContain('begins_with');
      expect(ops).toContain('doesnt_begin_with');
      expect(ops).toContain('ends_with');
      expect(ops).toContain('doesnt_end_with');
      expect(ops).toContain('null');
      expect(ops).toContain('not_null');
    });

    it('returns basic operators for integer type', () => {
      const ops = getConditionOperators(mockProperty({ type: 'integer' }));
      expect(ops).toContain('=');
      expect(ops).toContain('<');
      expect(ops).toContain('<=');
      expect(ops).toContain('>');
      expect(ops).toContain('>=');
      expect(ops).toContain('like');
    });

    it('returns basic operators for float type', () => {
      const ops = getConditionOperators(mockProperty({ type: 'float' }));
      expect(ops).toContain('=');
      expect(ops).toContain('<>');
      expect(ops).toContain('<');
    });

    it('returns enum operators when property has enum set', () => {
      const ops = getConditionOperators(mockProperty({ type: 'string', enum: 'status' }));
      expect(ops).toEqual(['=', '<>', 'in', 'not_in', 'null', 'not_null']);
    });

    it('returns date operators for date type', () => {
      const ops = getConditionOperators(mockProperty({ type: 'date' }));
      expect(ops).toEqual(['=', '<>', '<', '<=', '>', '>=', 'in', 'not_in', 'null', 'not_null']);
    });

    it('returns time operators for time type', () => {
      const ops = getConditionOperators(mockProperty({ type: 'time' }));
      expect(ops).toEqual(['=', '<>', '<', '<=', '>', '>=', 'in', 'not_in', 'null', 'not_null']);
    });

    it('returns datetime operators for datetime type', () => {
      const ops = getConditionOperators(mockProperty({ type: 'datetime' }));
      expect(ops).toEqual(['=', '<>', '<', '<=', '>', '>=', 'in', 'not_in', 'null', 'not_null']);
    });

    it('returns boolean operators for boolean type', () => {
      const ops = getConditionOperators(mockProperty({ type: 'boolean' }));
      expect(ops).toEqual(['=', 'null', 'not_null']);
    });

    it('falls back to basic operators for unknown type', () => {
      const ops = getConditionOperators(mockProperty({ type: 'unknown_custom_type' }));
      expect(ops).toContain('=');
      expect(ops).toContain('like');
      expect(ops).toContain('begins_with');
    });

    it('unwraps array type using getLeafTypeContainer', () => {
      const property = mockProperty({
        type: 'array',
        children: { type: 'string' },
      });
      // Array type without array operators defined: returns leaf operators unfiltered
      const ops = getConditionOperators(property);
      expect(ops).toContain('=');
      expect(ops).toContain('like');
    });

    it('filters operators by array operators list when array type has array operators defined', () => {
      registerOperators({
        condition: {
          array: ['=', '<>', 'null', 'not_null'],
        },
      });
      const property = mockProperty({
        type: 'array',
        children: { type: 'string' },
      });
      const ops = getConditionOperators(property);
      expect(ops).toEqual(['=', '<>', 'null', 'not_null']);
    });

    it('uses allowedOperators for a specific type when provided', () => {
      const allowed = {
        condition: {
          string: ['=' as const, '<>' as const],
        },
      };
      const ops = getConditionOperators(mockProperty({ type: 'string' }), allowed);
      expect(ops).toEqual(['=', '<>']);
    });

    it('falls back to allowedOperators.condition.basic when type not found in allowed or defaults', () => {
      const allowed = {
        condition: {
          basic: ['=' as const, 'null' as const],
        },
      };
      const ops = getConditionOperators(mockProperty({ type: 'unknown_custom_type' }), allowed);
      expect(ops).toEqual(['=', 'null']);
    });

    it('uses allowed array operators to filter when property is array type', () => {
      const property = mockProperty({
        type: 'array',
        children: { type: 'enum', enum: 'status' },
      });
      const allowed = {
        condition: {
          array: ['=' as const, 'in' as const, 'not_in' as const],
        },
      };
      const ops = getConditionOperators(property, allowed);
      // Enum operators filtered by allowed array operators
      expect(ops).toEqual(['=', 'in', 'not_in']);
    });
  });

  describe('getContainerOperators', () => {
    it('returns group operators for "group" filter type', () => {
      const ops = getContainerOperators('group');
      expect(ops).toEqual(['and', 'or']);
    });

    it('returns relationship operators for "relationship_condition" filter type', () => {
      const ops = getContainerOperators('relationship_condition');
      expect(ops).toEqual(['has', 'has_not']);
    });

    it('uses allowedOperators when provided for group', () => {
      const ops = getContainerOperators('group', { group: ['and'] });
      expect(ops).toEqual(['and']);
    });

    it('uses allowedOperators when provided for relationship_condition', () => {
      const ops = getContainerOperators('relationship_condition', {
        relationship_condition: ['has'],
      });
      expect(ops).toEqual(['has']);
    });

    it('falls back to defaults when allowedOperators is null', () => {
      const ops = getContainerOperators('group', null);
      expect(ops).toEqual(['and', 'or']);
    });
  });

  describe('getOperatorTranslation', () => {
    it('returns symbolic operators as-is for "="', () => {
      const result = getOperatorTranslation('condition', '=');
      // '=' maps to '=' in operatorNames, which does not start with a letter
      expect(result).toBe('=');
    });

    it('returns symbolic operator as-is for "<>"', () => {
      // '<>' maps to '≠'
      const result = getOperatorTranslation('condition', '<>');
      expect(result).toBe('≠');
    });

    it('returns symbolic operator as-is for "<"', () => {
      expect(getOperatorTranslation('condition', '<')).toBe('<');
    });

    it('returns symbolic operator as-is for "<="', () => {
      expect(getOperatorTranslation('condition', '<=')).toBe('<=');
    });

    it('returns symbolic operator as-is for ">"', () => {
      expect(getOperatorTranslation('condition', '>')).toBe('>');
    });

    it('returns symbolic operator as-is for ">="', () => {
      expect(getOperatorTranslation('condition', '>=')).toBe('>=');
    });

    it('translates word-based condition operators via i18n', () => {
      // Word operators like 'like' start with a letter, so translate() is called
      const result = getOperatorTranslation('condition', 'like');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('translates group operators via i18n', () => {
      const result = getOperatorTranslation('group', 'and');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('translates relationship operators via i18n', () => {
      const result = getOperatorTranslation('relationship_condition', 'has');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('isValidOperator', () => {
    it('returns true for a valid condition operator', () => {
      expect(isValidOperator('condition', '=')).toBe(true);
    });

    it('returns true for a valid group operator', () => {
      expect(isValidOperator('group', 'and')).toBe(true);
    });

    it('returns true for a valid relationship operator', () => {
      expect(isValidOperator('relationship_condition', 'has')).toBe(true);
    });

    it('returns false for an invalid operator', () => {
      expect(isValidOperator('condition', 'invalid_op')).toBe(false);
    });

    it('returns false for null', () => {
      expect(isValidOperator('condition', null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isValidOperator('condition', undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidOperator('condition', '')).toBe(false);
    });
  });

  describe('registerOperators', () => {
    it('overrides condition operators for a type', () => {
      registerOperators({
        condition: {
          boolean: ['=', '<>'],
        },
      });
      const ops = getConditionOperators(mockProperty({ type: 'boolean' }));
      expect(ops).toEqual(['=', '<>']);
    });

    it('overrides group operators', () => {
      registerOperators({ group: ['or'] });
      const ops = getContainerOperators('group');
      expect(ops).toEqual(['or']);
    });

    it('overrides relationship operators', () => {
      registerOperators({ relationship_condition: ['has_not'] });
      const ops = getContainerOperators('relationship_condition');
      expect(ops).toEqual(['has_not']);
    });

    it('does not affect unrelated operator types when overriding one', () => {
      registerOperators({ group: ['or'] });
      // Condition operators should remain unchanged
      const condOps = getConditionOperators(mockProperty({ type: 'boolean' }));
      expect(condOps).toEqual(['=', 'null', 'not_null']);
      // Relationship operators should remain unchanged
      const relOps = getContainerOperators('relationship_condition');
      expect(relOps).toEqual(['has', 'has_not']);
    });

    it('adds new custom condition type operators', () => {
      registerOperators({
        condition: {
          custom_type: ['=', '<>'],
        },
      });
      const ops = getConditionOperators(mockProperty({ type: 'custom_type' }));
      expect(ops).toEqual(['=', '<>']);
    });
  });

  describe('_resetForTesting', () => {
    it('restores default condition operators after override', () => {
      registerOperators({
        condition: {
          boolean: ['=', '<>', 'like'],
        },
      });
      expect(getConditionOperators(mockProperty({ type: 'boolean' }))).toEqual(['=', '<>', 'like']);

      _resetForTesting();
      expect(getConditionOperators(mockProperty({ type: 'boolean' }))).toEqual([
        '=',
        'null',
        'not_null',
      ]);
    });

    it('restores default group operators after override', () => {
      registerOperators({ group: ['or'] });
      expect(getContainerOperators('group')).toEqual(['or']);

      _resetForTesting();
      expect(getContainerOperators('group')).toEqual(['and', 'or']);
    });

    it('restores default relationship operators after override', () => {
      registerOperators({ relationship_condition: ['has'] });
      expect(getContainerOperators('relationship_condition')).toEqual(['has']);

      _resetForTesting();
      expect(getContainerOperators('relationship_condition')).toEqual(['has', 'has_not']);
    });
  });
});
