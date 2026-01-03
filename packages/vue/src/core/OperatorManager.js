import { translate } from '@i18n/i18n';

const operatorNames = {
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

const operators = {
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

/**
 *
 * @param {'group'|'relationship_condition'} filterType
 * @param {object} allowedOperators
 * @returns
 */
const getContainerOperators = (filterType, allowedOperators) => {
  return allowedOperators?.[filterType] || operators[filterType];
};

/**
 *
 * @param {'condition'|'scope'} filterType
 * @param {string} target - a property id if given filterType is 'condition'
 *                          or a scope id if given filterType is 'scope'
 * @param {object} schema - the schema that contains property or scope
 * @param {object} allowedOperators
 * @param {object} computedScopes
 * @returns
 */
const getConditionOperators = (filterType, target, schema, allowedOperators = null, computedScopes = null) => {
  const targetObject =
    filterType == 'condition'
      ? schema.mapProperties[target]
      : computedScopes?.[schema.name]?.find((scope) => scope.id == target) || schema.mapScopes[target];

  if (!targetObject) {
    throw new Error(`invalid target ${target}`);
  }
  let containerType = targetObject;
  let isArray = false;
  while (containerType.type == 'array') {
    containerType = containerType.children;
    isArray = true;
  }
  const type = containerType.enum ? 'enum' : containerType.type;
  let currentOperators =
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
      // we keep only the intersection of the element type operators and array operators
      currentOperators = currentOperators.filter((value) => arrayOperators.includes(value));
    }
  }
  return currentOperators;
};

/**
 *
 * @param {'condition'|'group'|'relationship_condition'} container
 * @param {string} operator
 * @returns
 */
const getOperatorTranslation = (container, operator) => {
  let label = operatorNames[container][operator.toLowerCase()];
  return label.charAt(0).match(/[a-z]/i) ? translate(label) : label;
};

/**
 *
 * @param {'condition'|'group'|'relationship_condition'} container
 * @param {string} operator
 * @param {boolean} caseSensitive
 * @returns
 */
const isValidOperator = (container, operator, caseSensitive = true) => {
  return operatorNames[container][operator] || (!caseSensitive && operatorNames[container][operator.toLowerCase()]);
};

const registerAllowedOperators = (allowedOperators) => {
  if (allowedOperators.condition) {
    for (const key in allowedOperators.condition) {
      if (!Object.hasOwn(allowedOperators.condition, key)) {
        continue;
      }
      operators.condition[key] = allowedOperators.condition[key].map((op) => op.toLowerCase());
    }
    Object.assign(operators.condition, allowedOperators.condition);
  }
  if (allowedOperators.group) {
    operators.group = allowedOperators.group.map((op) => op.toLowerCase());
  }
  if (allowedOperators.relationship_condition) {
    operators.relationship_condition = allowedOperators.relationship_condition.map((op) => op.toLowerCase());
  }
};

export {
  getContainerOperators,
  getConditionOperators,
  getOperatorTranslation,
  isValidOperator,
  registerAllowedOperators,
};
