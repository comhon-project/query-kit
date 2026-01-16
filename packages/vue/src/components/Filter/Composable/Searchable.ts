import { computed, ref, watchEffect, type Ref, type ComputedRef } from 'vue';
import {
  getConditionOperators,
  getContainerOperators,
  type AllowedOperators,
  type ComputedScopes,
  type ComputedScope,
} from '@core/OperatorManager';
import { getFiltrableProperties, getFiltrableScopes } from '@core/RequestSchema';
import type { EntitySchema, Property, Scope } from '@core/EntitySchema';

export interface SearchableProps {
  entity: string;
  allowedProperties?: Record<string, string[]>;
  allowedScopes?: Record<string, string[]>;
  allowedOperators?: AllowedOperators;
  computedScopes?: ComputedScopes;
}

export interface UseSearchableReturn {
  searchableProperties: Ref<Property[]>;
  searchableScopes: Ref<Scope[]>;
  searchableComputedScopes: ComputedRef<ComputedScope[]>;
}

const useSearchable = (props: SearchableProps, schema: Ref<EntitySchema | null>): UseSearchableReturn => {
  const searchableProperties: Ref<Property[]> = ref([]);
  const searchableScopes: Ref<Scope[]> = ref([]);

  watchEffect(async () => {
    const filter = props.allowedProperties?.[props.entity];
    let propertyNames = await getFiltrableProperties(props.entity);
    if (propertyNames.length && filter) {
      propertyNames = propertyNames.filter((value) => filter.includes(value));
    }
    if (!schema.value || schema.value.id !== props.entity) return;
    const properties: Property[] = [];
    const hasRelationshipOperator = getContainerOperators('relationship_condition', props.allowedOperators).length;
    for (const propertyName of propertyNames) {
      const property = schema.value.mapProperties[propertyName];
      if (!property) {
        throw new Error(`Property "${propertyName}" not found in schema "${props.entity}"`);
      }
      if (property.type === 'relationship') {
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
    const currentSchema = schema.value;
    if (!currentSchema) return;
    searchableScopes.value = scopeIds.map((scopeId) => {
      const scope = currentSchema.mapScopes[scopeId];
      if (!scope) {
        throw new Error(`Scope "${scopeId}" not found in schema "${props.entity}"`);
      }
      return scope;
    });
  });

  const searchableComputedScopes = computed((): ComputedScope[] => {
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
