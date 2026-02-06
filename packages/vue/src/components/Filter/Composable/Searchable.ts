import { computed, ref, watchEffect, type Ref, type ComputedRef } from 'vue';
import { getConditionOperators, getContainerOperators } from '@core/OperatorManager';
import { getComputedScopes, type ComputedScope } from '@core/ComputedScopesManager';
import { getFiltrableProperties, getFiltrableScopes } from '@core/RequestSchema';
import type { EntitySchema, Property, Scope } from '@core/EntitySchema';
import type { BuilderConfig } from '@core/types';

export interface UseSearchableReturn {
  searchableProperties: Ref<Property[]>;
  searchableScopes: Ref<Scope[]>;
  searchableComputedScopes: ComputedRef<ComputedScope[]>;
}

const useSearchable = (config: BuilderConfig, schema: Ref<EntitySchema | null>): UseSearchableReturn => {
  const searchableProperties: Ref<Property[]> = ref([]);
  const searchableScopes: Ref<Scope[]> = ref([]);

  watchEffect(async () => {
    if (!schema.value) return;
    const entity = schema.value.id;
    const filter = config.allowedProperties?.[entity];
    let propertyNames = await getFiltrableProperties(entity);
    if (propertyNames.length && filter) {
      propertyNames = propertyNames.filter((value) => filter.includes(value));
    }
    const properties: Property[] = [];
    const hasRelationshipOperator = getContainerOperators('relationship_condition', config.allowedOperators).length;
    for (const propertyName of propertyNames) {
      const property = schema.value.getProperty(propertyName);
      if (property.type === 'relationship') {
        if (hasRelationshipOperator) {
          properties.push(property);
        }
      } else if (getConditionOperators(property, config.allowedOperators).length) {
        properties.push(property);
      }
    }
    searchableProperties.value = properties;
  });

  watchEffect(async () => {
    const currentSchema = schema.value;
    if (!currentSchema) return;
    const entity = currentSchema.id;
    const filter = config.allowedScopes?.[entity];
    let scopeIds = await getFiltrableScopes(entity);
    if (scopeIds.length && filter) {
      scopeIds = scopeIds.filter((scopeId) => filter.includes(scopeId));
    }
    searchableScopes.value = scopeIds.map((scopeId) => currentSchema.getScope(scopeId));
  });

  const searchableComputedScopes = computed((): ComputedScope[] => {
    if (!schema.value) return [];
    const entity = schema.value.id;
    const scopes = getComputedScopes(entity);
    if (!scopes.length) {
      return [];
    }
    const filter = config.allowedScopes?.[entity];
    if (filter) {
      return scopes.filter((scope) => filter.includes(scope.id));
    }
    return scopes;
  });

  return { searchableProperties, searchableScopes, searchableComputedScopes };
};

export { useSearchable };
