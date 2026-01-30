<script setup lang="ts">
import { ref, watch, toRaw, watchEffect, onUnmounted } from 'vue';
import { resolve, type EntitySchema, type Scope } from '@core/EntitySchema';
import Group from '@components/Filter/Group.vue';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import type { AllowedOperators } from '@core/OperatorManager';
import { getComputedScope, type ComputedScope } from '@core/ComputedScopesManager';
import type { GroupFilter, Filter, DisplayOperator, AllowedScopes, AllowedProperties, ScopeFilter } from '@core/types';

/**
 * Mutable filter type for dynamic manipulation in getComputedFilter().
 * We use Record<string, unknown> because:
 * - structuredClone returns a runtime object without TypeScript guarantees
 * - We delete properties dynamically (key, editable, removable, id)
 * - We use Object.assign with computed scope values
 * The double-cast (as unknown as) is the standard TypeScript pattern for this.
 */
type MutableFilter = Record<string, unknown>;

interface Props {
  modelValue: GroupFilter;
  entity: string;
  allowReset?: boolean;
  allowedScopes?: AllowedScopes;
  allowedProperties?: AllowedProperties;
  allowedOperators?: AllowedOperators;
  displayOperator?: DisplayOperator;
  userTimezone?: string;
  requestTimezone?: string;
  deferred?: number;
  collectionId?: string;
  onValidate?: () => void;
}

interface Emits {
  computed: [filter: MutableFilter];
  goToCollection: [];
}

const emit = defineEmits<Emits>();

const props = withDefaults(defineProps<Props>(), {
  allowReset: true,
  displayOperator: true,
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
  deferred: 1000,
});

let timeoutId: ReturnType<typeof setTimeout> | undefined;
let originalFilter: GroupFilter;
const schema = ref<EntitySchema | null>(null);

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId);
});

async function initSchema(): Promise<void> {
  schema.value = await resolve(props.entity);
}

function reset(): void {
  const mutableModel = props.modelValue as unknown as MutableFilter;
  for (const member of Object.keys(mutableModel)) delete mutableModel[member];
  Object.assign(props.modelValue, structuredClone(originalFilter));
}

function getScopeDefinition(scopeId: string, entitySchema: EntitySchema): Scope | ComputedScope | undefined {
  const computedScope = getComputedScope(entitySchema.id, scopeId);
  if (computedScope) return computedScope;
  try {
    return entitySchema.getScope(scopeId);
  } catch {
    return undefined;
  }
}

function isScopeFilled(scope: Scope | ComputedScope, filter: ScopeFilter): boolean {
  if (!scope.parameters?.length) {
    return true;
  }
  for (let i = 0; i < scope.parameters.length; i++) {
    const param = scope.parameters[i];
    if (param.nullable !== false) continue;
    const paramValue = filter.parameters?.[i];
    const isParamEmpty =
      paramValue === undefined ||
      paramValue === null ||
      (Array.isArray(paramValue) && paramValue.filter((v) => v !== undefined).length === 0);
    if (isParamEmpty) {
      return false;
    }
  }
  return true;
}

function mustKeepFilter(filter: Filter, entitySchema: EntitySchema): boolean {
  if ('operator' in filter && (filter.operator == 'null' || filter.operator == 'not_null')) {
    return true;
  }
  if (filter.type == 'scope') {
    const scope = getScopeDefinition(filter.id, entitySchema);
    return !!scope && isScopeFilled(scope, filter);
  }
  if (filter.type == 'condition') {
    const isEmpty =
      filter.value === undefined ||
      (Array.isArray(filter.value) && filter.value.filter((value) => value !== undefined).length == 0);
    return !isEmpty;
  }
  return true;
}

async function getComputedFilter(): Promise<MutableFilter> {
  const computedFilter = structuredClone(toRaw(props.modelValue)) as unknown as MutableFilter;
  const stack: Array<[MutableFilter, EntitySchema]> = [[computedFilter, schema.value!]];
  while (stack.length) {
    const [currentFilter, currentSchema] = stack.pop()!;
    if (currentFilter.type == 'relationship_condition') {
      if (currentFilter.filter) {
        const schemaId = currentSchema.getProperty(currentFilter.property as string).related!;
        const childSchema = await resolve(schemaId);
        if (mustKeepFilter(currentFilter.filter as Filter, childSchema)) {
          stack.push([currentFilter.filter as MutableFilter, childSchema]);
        } else {
          delete currentFilter.filter;
        }
      }
    } else if (currentFilter.type == 'group') {
      const filters: MutableFilter[] = [];
      for (const filter of currentFilter.filters as MutableFilter[]) {
        if (!mustKeepFilter(filter as unknown as Filter, currentSchema)) {
          continue;
        }
        stack.push([filter, currentSchema]);
        filters.push(filter);
      }
      currentFilter.filters = filters;
    } else {
      if (Array.isArray(currentFilter.value)) {
        currentFilter.value = (currentFilter.value as unknown[]).filter((value) => value !== undefined);
      } else if (currentFilter.operator == 'like' || currentFilter.operator == 'not_like') {
        currentFilter.value = `%${currentFilter.value}%`;
      } else if (currentFilter.operator == 'begins_with' || currentFilter.operator == 'doesnt_begin_with') {
        currentFilter.operator = currentFilter.operator == 'begins_with' ? 'like' : 'not_like';
        currentFilter.value = `${currentFilter.value}%`;
      } else if (currentFilter.operator == 'ends_with' || currentFilter.operator == 'doesnt_end_with') {
        currentFilter.operator = currentFilter.operator == 'ends_with' ? 'like' : 'not_like';
        currentFilter.value = `%${currentFilter.value}`;
      }
      if (currentFilter.type == 'scope') {
        const parameters = currentFilter.parameters as unknown[] | undefined;
        if (parameters?.length) {
          for (let i = 0; i < parameters.length; i++) {
            if (Array.isArray(parameters[i])) {
              parameters[i] = (parameters[i] as unknown[]).filter((v) => v !== undefined);
            }
          }
        }
        const scope = getScopeDefinition(currentFilter.id as string, currentSchema);
        if (scope && (scope as ComputedScope).computed) {
          delete currentFilter.id;
          const computedScopeValue = (scope as ComputedScope).computed!(parameters || []);
          if (typeof computedScopeValue != 'object') {
            throw new Error(`invalid computed value for scope ${scope.id}, value must be an object`);
          }
          Object.assign(currentFilter, computedScopeValue);
        }
      }
    }
    delete currentFilter.key;
    delete currentFilter.editable;
    delete currentFilter.removable;
  }
  return computedFilter;
}

watchEffect(async () => {
  await initSchema();
  originalFilter = structuredClone(toRaw(props.modelValue));
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  timeoutId = setTimeout(async () => {
    emit('computed', await getComputedFilter());
  }, props.deferred);
});
watch(props.modelValue, () => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  timeoutId = setTimeout(async () => {
    emit('computed', await getComputedFilter());
  }, props.deferred);
});
</script>

<template>
  <section :class="classes.builder" :aria-label="translate('filter')">
    <a v-if="collectionId" :href="'#' + collectionId" :class="classes.skip_link">{{ translate('go_to_collection') }}</a>
    <Group v-if="schema" v-bind="props" :on-reset="allowReset ? reset : undefined" @exit="$emit('goToCollection')" />
  </section>
</template>
