import { computed } from 'vue';

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
    in: 'in',
    not_in: 'not_in',
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
    basic: ['=', '<>', '<', '<=', '>', '>=', 'in', 'not_in', 'like', 'not_like'],
    enum: ['=', '<>', 'in', 'not_in'],
    // ---------------
    date: ['=', '<>', '<', '<=', '>', '>=', 'in', 'not_in'],
    time: ['=', '<>', '<', '<=', '>', '>=', 'in', 'not_in'],
    datetime: ['=', '<>', '<', '<=', '>', '>=', 'in', 'not_in'],
    boolean: ['='],
  },
  group: ['and', 'or'],
  relationship_condition: ['has', 'has_not'],
};

const getOperators = (
  conditionType,
  allowedOperators,
  targetCondition = null,
  schema = null,
  computedScopes = null
) => {
  const isConditionKind = conditionType == 'condition' || conditionType == 'scope';
  let target;
  if (isConditionKind) {
    if (!targetCondition) {
      throw new Error('targetCondition is required when conditionType is "condition" or "scope"');
    }
    if (!schema) {
      throw new Error('schema is required when targetCondition is given');
    }
    if (conditionType == 'condition') {
      target = schema.value.mapProperties[targetCondition];
    } else {
      target =
        computedScopes && computedScopes[schema.value.name]
          ? computedScopes[schema.value.name].find((scope) => scope.id == targetCondition)
          : null;
      target = target || schema.value.mapScopes[targetCondition];
    }
    if (!target) {
      throw new Error(`invalid targetCondition ${targetCondition}`);
    }
  }
  let currentOperators =
    allowedOperators && allowedOperators[conditionType]
      ? allowedOperators[conditionType]
      : isConditionKind
      ? operators.condition.basic
      : operators[conditionType];
  if (target && isConditionKind) {
    let containerType = target;
    let isArray = false;
    while (containerType.type == 'array') {
      containerType = containerType.children;
      isArray = true;
    }
    const type = containerType.enum ? 'enum' : containerType.type;
    if (allowedOperators && allowedOperators[type]) {
      currentOperators = allowedOperators[type];
    } else if ((!allowedOperators || !allowedOperators[conditionType]) && operators.condition[type]) {
      currentOperators = operators.condition[type];
    }
    if (isArray && (operators?.condition?.array || allowedOperators?.array)) {
      const filterOperators = allowedOperators?.array || operators?.condition?.array;
      currentOperators = currentOperators.filter((value) => filterOperators.includes(value));
    }
  }
  return currentOperators;
};

const useHelpers = (props, schema) => {
  const searchableProperties = computed(() => {
    const filter = props.allowedProperties ? props.allowedProperties[props.model] : null;
    let search = schema.value.search && schema.value.search.filters ? schema.value.search.filters : [];
    if (search.length && filter) {
      search = search.filter((value) => filter.includes(value));
    }
    const properties = [];
    const hasRelationshipOperator = getOperators('relationship_condition', props.allowedOperators).length;
    for (const propertyName of search) {
      const property = schema.value.mapProperties[propertyName];
      if (property.type == 'relationship') {
        if (hasRelationshipOperator) {
          properties.push(property);
        }
      } else if (getOperators('condition', props.allowedOperators, property.id, schema).length) {
        properties.push(property);
      }
    }
    return properties;
  });

  const searchableScopes = computed(() => {
    const filter = props.allowedScopes ? props.allowedScopes[props.model] : null;
    let scopes = schema.value.search && schema.value.search.scopes ? schema.value.search.scopes : [];
    if (scopes.length && filter) {
      scopes = scopes.filter((scope) => filter.includes(scope.id));
    }
    return scopes;
  });

  const searchableComputedScopes = computed(() => {
    if (!props.computedScopes || !props.computedScopes[props.model]) {
      return [];
    }
    const filter = props.allowedScopes ? props.allowedScopes[props.model] : null;
    let scopes = props.computedScopes[props.model];
    if (scopes.length && filter) {
      scopes = scopes.filter((scope) => filter.includes(scope.id));
    }
    return scopes;
  });

  return { searchableProperties, searchableScopes, searchableComputedScopes };
};

const registerAllowedOperators = (allowedOperators) => {
  if (allowedOperators.condition) {
    for (const key in allowedOperators.condition) {
      if (!Object.hasOwnProperty.call(allowedOperators.condition, key)) {
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

export { useHelpers, operatorNames, getOperators, registerAllowedOperators };
