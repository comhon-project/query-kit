import { computed, ref, watchEffect, type Ref, type ComputedRef } from 'vue';
import { getConditionOperators, getContainerOperators } from '@core/OperatorManager';
import { getComputedScopes, type ComputedScope } from '@core/ComputedScopesManager';
import { getFiltrableProperties, getFiltrableScopes } from '@core/RequestSchema';
import { PropertyNotFoundError } from '@core/errors';
import type { EntitySchema, Property, Scope } from '@core/EntitySchema';
import type { BuilderConfig } from '@core/types';

export interface UseSearchableReturn {
  searchableProperties: Ref<Property[]>;
  searchableScopes: Ref<Scope[]>;
  searchableComputedScopes: ComputedRef<ComputedScope[]>;
  invalidProperties: Ref<string[]>;
  invalidScopes: Ref<string[]>;
  hasSearchableItems: ComputedRef<boolean>;
}

const useSearchable = (config: BuilderConfig, props: { entitySchema: EntitySchema }): UseSearchableReturn => {
  const searchableProperties: Ref<Property[]> = ref([]);
  const searchableScopes: Ref<Scope[]> = ref([]);
  const invalidProperties: Ref<string[]> = ref([]);
  const invalidScopes: Ref<string[]> = ref([]);

  watchEffect(async () => {
    const entity = props.entitySchema.id;
    const filter = config.allowedProperties?.[entity];
    let propertyNames = await getFiltrableProperties(entity);
    if (propertyNames.length && filter) {
      propertyNames = propertyNames.filter((value) => filter.includes(value));
    }
    const properties: Property[] = [];
    const invalid: string[] = [];
    const hasRelationshipOperator = getContainerOperators('relationship_condition', config.allowedOperators).length;
    for (const propertyName of propertyNames) {
      try {
        const property = props.entitySchema.getProperty(propertyName);
        if (property.type === 'relationship') {
          if (hasRelationshipOperator) {
            properties.push(property);
          }
        } else if (getConditionOperators(property, config.allowedOperators).length) {
          properties.push(property);
        }
      } catch (e) {
        if (e instanceof PropertyNotFoundError) {
          invalid.push(propertyName);
        } else {
          throw e;
        }
      }
    }
    searchableProperties.value = properties;
    invalidProperties.value = invalid;
  });

  watchEffect(async () => {
    const entity = props.entitySchema.id;
    const filter = config.allowedScopes?.[entity];
    let scopeIds = await getFiltrableScopes(entity);
    if (scopeIds.length && filter) {
      scopeIds = scopeIds.filter((scopeId) => filter.includes(scopeId));
    }
    const scopes: Scope[] = [];
    const invalid: string[] = [];
    for (const scopeId of scopeIds) {
      try {
        scopes.push(props.entitySchema.getScope(scopeId));
      } catch {
        invalid.push(scopeId);
        continue;
      }
    }
    searchableScopes.value = scopes;
    invalidScopes.value = invalid;
  });

  const searchableComputedScopes = computed((): ComputedScope[] => {
    const entity = props.entitySchema.id;
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

  const hasSearchableItems = computed(() => {
    return !!(searchableProperties.value.length || searchableScopes.value.length || searchableComputedScopes.value.length);
  });

  return { searchableProperties, searchableScopes, searchableComputedScopes, invalidProperties, invalidScopes, hasSearchableItems };
};

export { useSearchable };
