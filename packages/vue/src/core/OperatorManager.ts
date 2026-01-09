import { translate } from '@i18n/i18n';
import type { ArrayableTypeContainer, EntitySchema, Property, Scope } from '@core/EntitySchema';
import type { ContainerFilterType } from '@core/types';

export type ConditionOperator =
  | '='
  | '<>'
  | '<'
  | '<='
  | '>'
  | '>='
  | 'like'
  | 'not_like'
  | 'ends_with'
  | 'doesnt_end_with'
  | 'begins_with'
  | 'doesnt_begin_with'
  | 'in'
  | 'not_in'
  | 'null'
  | 'not_null';

export type GroupOperator = 'and' | 'or';
export type RelationshipOperator = 'has' | 'has_not';

interface OperatorNames {
  condition: Record<ConditionOperator, string>;
  group: Record<GroupOperator, string>;
  relationship_condition: Record<RelationshipOperator, string>;
}

interface ConditionOperators {
  basic: ConditionOperator[];
  enum: ConditionOperator[];
  date: ConditionOperator[];
  time: ConditionOperator[];
  datetime: ConditionOperator[];
  boolean: ConditionOperator[];
  array?: ConditionOperator[];
  [key: string]: ConditionOperator[] | undefined;
}

interface Operators {
  condition: ConditionOperators;
  group: GroupOperator[];
  relationship_condition: RelationshipOperator[];
}

export interface AllowedOperators {
  condition?: Partial<ConditionOperators>;
  group?: GroupOperator[];
  relationship_condition?: RelationshipOperator[];
}

export interface ComputedScope extends Scope {
  computed?: (parameters: unknown[]) => Record<string, unknown>;
}

export type ComputedScopes = Record<string, ComputedScope[]>;

const operatorNames: OperatorNames = {
  condition: {
    '=': '=',
    '<>': '≠',
    '<': '<',
    '<=': '<=',
    '>': '>',
    '>=': '>=',
    like: 'like',
    not_like: 'not_like',
    ends_with: 'ends_with',
    doesnt_end_with: 'doesnt_end_with',
    begins_with: 'begins_with',
    doesnt_begin_with: 'doesnt_begin_with',
    in: 'in',
    not_in: 'not_in',
    null: 'null',
    not_null: 'not_null',
  },
  group: {
    and: 'and',
    or: 'or',
  },
  relationship_condition: {
    has: 'has',
    has_not: 'has_not',
  },
};

const operators: Operators = {
  condition: {
    basic: [
      '=',
      '<>',
      '<',
      '<=',
      '>',
      '>=',
      'in',
      'not_in',
      'like',
      'not_like',
      'begins_with',
      'doesnt_begin_with',
      'ends_with',
      'doesnt_end_with',
      'null',
      'not_null',
    ],
    enum: ['=', '<>', 'in', 'not_in', 'null', 'not_null'],
    date: ['=', '<>', '<', '<=', '>', '>=', 'in', 'not_in', 'null', 'not_null'],
    time: ['=', '<>', '<', '<=', '>', '>=', 'in', 'not_in', 'null', 'not_null'],
    datetime: ['=', '<>', '<', '<=', '>', '>=', 'in', 'not_in', 'null', 'not_null'],
    boolean: ['=', 'null', 'not_null'],
  },
  group: ['and', 'or'],
  relationship_condition: ['has', 'has_not'],
};

const getContainerOperators = (
  filterType: ContainerFilterType,
  allowedOperators?: AllowedOperators | null,
): GroupOperator[] | RelationshipOperator[] => {
  return allowedOperators?.[filterType] || operators[filterType];
};

const getConditionOperators = (
  filterType: 'condition' | 'scope',
  target: string,
  schema: EntitySchema,
  allowedOperators: AllowedOperators | null = null,
  computedScopes: ComputedScopes | null = null,
): ConditionOperator[] => {
  const targetObject: Property | Scope | ComputedScope | undefined =
    filterType === 'condition'
      ? schema.mapProperties[target]
      : computedScopes?.[schema.id]?.find((scope) => scope.id === target) || schema.mapScopes[target];

  if (!targetObject) {
    throw new Error(`invalid target ${target}`);
  }
  let containerType: ArrayableTypeContainer = targetObject as ArrayableTypeContainer;
  let isArray = false;
  while (containerType.type === 'array') {
    containerType = containerType.children!;
    isArray = true;
  }
  const type = containerType.enum ? 'enum' : containerType.type;
  let currentOperators: ConditionOperator[] =
    allowedOperators?.condition?.[type] ||
    operators.condition[type] ||
    allowedOperators?.condition?.basic ||
    operators.condition.basic;

  if (!Array.isArray(currentOperators)) {
    throw new Error(`invalid operators definition for ${type}`);
  }
  if (isArray) {
    const arrayOperators = allowedOperators?.condition?.array || operators?.condition?.array;
    if (arrayOperators) {
      currentOperators = currentOperators.filter((value) => arrayOperators.includes(value));
    }
  }
  return currentOperators;
};

const getOperatorTranslation = (
  container: 'condition' | 'group' | 'relationship_condition',
  operator: string,
): string => {
  const names = operatorNames[container] as Record<string, string>;
  const label = names[operator.toLowerCase()];
  return label.charAt(0).match(/[a-z]/i) ? translate(label) ?? label : label;
};

const isValidOperator = (
  container: 'condition' | 'group' | 'relationship_condition',
  operator: string,
  caseSensitive: boolean = true,
): boolean => {
  const names = operatorNames[container] as Record<string, string>;
  return !!(names[operator] || (!caseSensitive && names[operator.toLowerCase()]));
};

const registerAllowedOperators = (allowedOperators: AllowedOperators): void => {
  if (allowedOperators.condition) {
    for (const key in allowedOperators.condition) {
      if (!Object.hasOwn(allowedOperators.condition, key)) {
        continue;
      }
      const ops = allowedOperators.condition[key];
      if (ops) {
        operators.condition[key] = ops.map((op) => op.toLowerCase() as ConditionOperator);
      }
    }
    Object.assign(operators.condition, allowedOperators.condition);
  }
  if (allowedOperators.group) {
    operators.group = allowedOperators.group.map((op) => op.toLowerCase() as GroupOperator);
  }
  if (allowedOperators.relationship_condition) {
    operators.relationship_condition = allowedOperators.relationship_condition.map(
      (op) => op.toLowerCase() as RelationshipOperator,
    );
  }
};

export {
  getContainerOperators,
  getConditionOperators,
  getOperatorTranslation,
  isValidOperator,
  registerAllowedOperators,
};
