<script setup lang="ts">
import { ref, reactive, watch, watchEffect, toRaw, onUnmounted, provide } from 'vue';
import { resolve, type EntitySchema, type Scope } from '@core/EntitySchema';
import { getUniqueId } from '@core/Utils';
import Group from '@components/Filter/Group.vue';
import IconButton from '@components/Common/IconButton.vue';
import InvalidEntity from '@components/Messages/InvalidEntity.vue';
import { classes } from '@core/ClassManager';
import { config as globalConfig } from '@config/config';
import { translate } from '@i18n/i18n';
import { getContainerOperators, type AllowedOperators } from '@core/OperatorManager';
import { getComputedScope, type ComputedScope } from '@core/ComputedScopesManager';
import {
  type GroupFilter,
  type Filter,
  type DisplayOperator,
  type AllowedScopes,
  type AllowedProperties,
  type ScopeFilter,
  type BuilderConfig,
} from '@core/types';
import { builderConfigKey } from '@core/InjectionKeys';
import { useHistory } from '@components/Filter/Composable/History';
import { deepEqual } from '@core/Utils';

interface Props {
  entity: string;
  allowReset?: boolean;
  allowUndo?: boolean;
  allowRedo?: boolean;
  allowedScopes?: AllowedScopes;
  allowedProperties?: AllowedProperties;
  allowedOperators?: AllowedOperators;
  displayOperator?: DisplayOperator;
  userTimezone?: string;
  requestTimezone?: string;
  debounce?: number;
  collectionId?: string;
  manual?: boolean;
}

interface Emits {
  computed: [filter: GroupFilter, manual: boolean];
}

const modelValue = defineModel<Filter | null>({ default: null });
const emit = defineEmits<Emits>();

// undefined: prevent Vue from casting absent boolean props to false
const props = withDefaults(defineProps<Props>(), {
  allowReset: undefined,
  allowUndo: undefined,
  allowRedo: undefined,
  displayOperator: undefined,
  manual: undefined,
});

let isInitialEmit = true;
let timeoutId: ReturnType<typeof setTimeout> | undefined;
let originalFilter: GroupFilter;
let lastEmitted: GroupFilter;
let lastComputedEmitted: GroupFilter | undefined;
const internalModel = ref<GroupFilter>(null!);
const entitySchema = ref<EntitySchema | null>(null);
const validEntity = ref(true);
const config = reactive<BuilderConfig>({} as BuilderConfig);
const { pushSnapshot, undo, redo, canUndo, canRedo, clearHistory } = useHistory();

provide(builderConfigKey, config);

function prepareFilters(filter: Filter): void {
  const stack: Filter[] = [filter];
  while (stack.length) {
    const current = stack.pop()!;
    current.key = getUniqueId();
    if (current.type === 'group') {
      if (!Array.isArray(current.filters)) {
        current.filters = [];
      }
      stack.push(...current.filters);
    }
    if (current.type === 'relationship_condition' && current.filter) {
      stack.push(current.filter);
    }
  }
}

function init(value: Filter | null): void {
  const raw = value ? toRaw(value) : null;
  const isGroup = raw?.type === 'group';
  const group: GroupFilter = isGroup
    ? raw
    : {
        type: 'group',
        filters: raw ? [raw] : [],
        operator: getContainerOperators('group', props.allowedOperators)?.[0] || 'and',
      };

  originalFilter = structuredClone(group);
  originalFilter.removable = false;
  prepareFilters(originalFilter);

  clearHistory();
  isInitialEmit = true;
  lastComputedEmitted = undefined;
  internalModel.value = structuredClone(originalFilter);
}

function stripKeys(filter: GroupFilter): GroupFilter {
  const clone = structuredClone(toRaw(filter));
  const stack: Filter[] = [clone];
  while (stack.length) {
    const current = stack.pop()!;
    delete current.key;
    if (current.type === 'group') {
      stack.push(...current.filters);
    }
    if (current.type === 'relationship_condition' && current.filter) {
      stack.push(current.filter);
    }
  }
  return clone;
}

function reset(): void {
  internalModel.value = structuredClone(originalFilter);
}

function performUndo(): void {
  const state = undo();
  if (state) internalModel.value = state;
}

function performRedo(): void {
  const state = redo();
  if (state) internalModel.value = state;
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
  if (filter.type == 'group') {
    return filter.filters.some((child) => mustKeepFilter(child, entitySchema));
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

async function getComputedFilter(): Promise<GroupFilter> {
  const entitySchema = await resolve(props.entity);
  const computedFilter = structuredClone(toRaw(internalModel.value));
  const stack: Array<[Filter, EntitySchema]> = [[computedFilter, entitySchema]];
  while (stack.length) {
    const [currentFilter, currentSchema] = stack.pop()!;
    if (currentFilter.type == 'relationship_condition') {
      if (currentFilter.filter) {
        const schemaId = currentSchema.getProperty(currentFilter.property).related!;
        const childSchema = await resolve(schemaId);
        if (mustKeepFilter(currentFilter.filter, childSchema)) {
          stack.push([currentFilter.filter, childSchema]);
        } else {
          delete currentFilter.filter;
        }
      }
    } else if (currentFilter.type == 'group') {
      const kept: Filter[] = [];
      for (const filter of currentFilter.filters) {
        if (!mustKeepFilter(filter, currentSchema)) continue;
        stack.push([filter, currentSchema]);
        kept.push(filter);
      }
      currentFilter.filters = kept;
    } else if (currentFilter.type == 'condition') {
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
    } else if (currentFilter.type == 'scope') {
      const parameters = currentFilter.parameters;
      if (parameters?.length) {
        for (let i = 0; i < parameters.length; i++) {
          if (Array.isArray(parameters[i])) {
            parameters[i] = (parameters[i] as unknown[]).filter((v) => v !== undefined);
          }
        }
      }
      const scope = getScopeDefinition(currentFilter.id, currentSchema);
      if (scope && (scope as ComputedScope).computed) {
        const computedScopeValue = (scope as ComputedScope).computed!(parameters || []);
        if (typeof computedScopeValue != 'object') {
          throw new Error(`invalid computed value for scope ${scope.id}, value must be an object`);
        }
        delete (currentFilter as { id?: string }).id;
        Object.assign(currentFilter, computedScopeValue);
      }
    }
    delete currentFilter.key;
    delete currentFilter.editable;
    delete currentFilter.removable;
  }
  return computedFilter;
}

function scheduleEmit(): void {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  timeoutId = setTimeout(async () => {
    pushSnapshot(internalModel.value);
    const stripped = stripKeys(internalModel.value);
    lastEmitted = stripped;
    modelValue.value = stripped;

    if (!config.manual || isInitialEmit) {
      isInitialEmit = false;
      const computed = await getComputedFilter();
      if (!deepEqual(computed, lastComputedEmitted)) {
        lastComputedEmitted = computed;
        emit('computed', computed, false);
      }
    }
  }, config.debounce);
}

async function validate(): Promise<void> {
  emit('computed', await getComputedFilter(), true);
}

function goToCollection(): void {
  if (props.collectionId) location.hash = props.collectionId;
}

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId);
});

// Must be before the other watches: config must be populated before scheduleEmit runs
watchEffect(() => {
  config.allowedScopes = props.allowedScopes;
  config.allowedProperties = props.allowedProperties;
  config.allowedOperators = props.allowedOperators;
  config.displayOperator = props.displayOperator ?? globalConfig.displayOperator;
  config.userTimezone = props.userTimezone ?? globalConfig.userTimezone;
  config.requestTimezone = props.requestTimezone ?? globalConfig.requestTimezone;
  config.allowReset = props.allowReset ?? globalConfig.allowReset;
  config.allowUndo = props.allowUndo ?? globalConfig.allowUndo;
  config.allowRedo = props.allowRedo ?? globalConfig.allowRedo;
  config.debounce = props.debounce ?? globalConfig.debounce;
  config.manual = props.manual ?? globalConfig.manual;
});

watch(
  modelValue,
  (newVal) => {
    // Prevent re-init loop: when scheduleEmit sets modelValue, this watch fires back.
    // We compare by reference to detect our own emission and skip it.
    // When newVal is null/undefined, always re-init (no reference to compare).
    if (!newVal || toRaw(newVal) !== lastEmitted) {
      init(newVal);
    }
  },
  { immediate: true },
);
watch(internalModel, scheduleEmit, { deep: true, immediate: true });

watchEffect(async () => {
  try {
    entitySchema.value = await resolve(props.entity);
    validEntity.value = true;
  } catch {
    entitySchema.value = null;
    validEntity.value = false;
  }
});
</script>

<template>
  <section :class="classes.builder" :aria-label="translate('filter')">
    <a v-if="collectionId" :href="'#' + collectionId" :class="classes.skip_link">{{ translate('go_to_collection') }}</a>
    <InvalidEntity v-if="!validEntity" :entity="entity" />
    <Group v-else-if="entitySchema" :model-value="internalModel" :entity-schema="entitySchema" @exit="goToCollection">
      <template #builder_actions>
        <IconButton v-if="config.allowUndo" icon="undo" :disabled="!canUndo" @click="performUndo" />
        <IconButton v-if="config.allowRedo" icon="redo" :disabled="!canRedo" @click="performRedo" />
        <IconButton v-if="config.allowReset" icon="reset" @click="reset" />
        <IconButton v-if="config.manual" icon="search" @click="validate" />
      </template>
    </Group>
  </section>
</template>
