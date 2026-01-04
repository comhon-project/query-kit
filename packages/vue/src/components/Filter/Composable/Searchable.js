import { computed, ref, watchEffect } from 'vue';
import { getConditionOperators, getContainerOperators } from '@core/OperatorManager';
import { getFiltrableProperties, getFiltrableScopes } from '@core/RequestSchema';

const useSearchable = (props, schema) => {
  const searchableProperties = ref([]);
  const searchableScopes = ref([]);

  watchEffect(async () => {
    const filter = props.allowedProperties?.[props.entity];
    let propertyNames = await getFiltrableProperties(props.entity);
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
    searchableProperties.value = properties;
  });

  watchEffect(async () => {
    const filter = props.allowedScopes ? props.allowedScopes[props.entity] : null;
    let scopeIds = await getFiltrableScopes(props.entity);
    if (scopeIds.length && filter) {
      scopeIds = scopeIds.filter((scopeId) => filter.includes(scopeId));
    }
    searchableScopes.value = scopeIds.map((scopeId) => schema.value.mapScopes[scopeId]);
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
