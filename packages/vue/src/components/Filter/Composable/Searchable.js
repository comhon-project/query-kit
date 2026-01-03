import { computed } from 'vue';
import { getConditionOperators, getContainerOperators } from '@core/OperatorManager';

const useSearchable = (props, schema) => {
  const searchableProperties = computed(() => {
    const filter = props.allowedProperties?.[props.entity];
    let propertyNames = schema.value.search?.properties || [];
    if (propertyNames.length && filter) {
      propertyNames = propertyNames.filter((value) => filter.includes(value));
    }
    const properties = [];
    const hasRelationshipOperator = getContainerOperators('relationship_condition', props.allowedOperators).length;
    for (const propertyName of propertyNames) {
      const property = schema.value.mapProperties[propertyName];
      if (property.type == 'relationship') {
        if (hasRelationshipOperator) {
          properties.push(property);
        }
      } else if (getConditionOperators('condition', property.id, schema.value, props.allowedOperators).length) {
        properties.push(property);
      }
    }
    return properties;
  });

  const searchableScopes = computed(() => {
    const filter = props.allowedScopes ? props.allowedScopes[props.entity] : null;
    let scopes = schema.value.search && schema.value.search.scopes ? schema.value.search.scopes : [];
    if (scopes.length && filter) {
      scopes = scopes.filter((scope) => filter.includes(scope.id));
    }
    return scopes;
  });

  const searchableComputedScopes = computed(() => {
    if (!props.computedScopes || !props.computedScopes[props.entity]) {
      return [];
    }
    const filter = props.allowedScopes ? props.allowedScopes[props.entity] : null;
    let scopes = props.computedScopes[props.entity];
    if (scopes.length && filter) {
      scopes = scopes.filter((scope) => filter.includes(scope.id));
    }
    return scopes;
  });

  return { searchableProperties, searchableScopes, searchableComputedScopes };
};

export { useSearchable };
