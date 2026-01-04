<script setup>
import { ref, watch, toRaw, watchEffect, onUnmounted } from 'vue';
import { resolve } from '@core/EntitySchema';
import Group from '@components/Filter/Group.vue';
import IconButton from '@components/Common/IconButton.vue';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';

const emit = defineEmits(['computed']);
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  entity: {
    type: String,
    required: true,
  },
  allowReset: {
    type: Boolean,
    default: true,
  },
  computedScopes: {
    type: Object, // {entity: [{id: 'scope_one', parameters: [...], computed: () => {...})}, ...], ...}
    default: undefined,
  },
  allowedScopes: {
    type: Object, // {entity: ['scope_one', 'scope_two', ...], ...}
    default: undefined,
  },
  allowedProperties: {
    type: Object, // {entity: ['property_name_one', 'property_name_two', ...], ...}
    default: undefined,
  },
  allowedOperators: {
    type: Object, // {condition: ['=', '<>', ...], group: ['AND', 'OR'], relationship_condition: ['HAS', 'HAS_NOT']}
    default: undefined,
  },
  displayOperator: {
    type: [Boolean, Object],
    default: true,
  },
  userTimezone: {
    type: String,
    default: 'UTC',
  },
  requestTimezone: {
    type: String,
    default: 'UTC',
  },
  deferred: {
    type: Number,
    default: 1000,
  },
  id: {
    type: String,
    default: undefined,
  },
});

let timeoutId;
let originalFilter;
const schema = ref(null);

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId);
});

async function initSchema() {
  schema.value = await resolve(props.entity);
}

function reset() {
  for (const member of Object.keys(props.modelValue)) delete props.modelValue[member];
  Object.assign(props.modelValue, structuredClone(originalFilter));
}

function getScopeDefinition(scopeId, schema) {
  let scope =
    props.computedScopes && props.computedScopes[props.entity]
      ? props.computedScopes[props.entity].find((scope) => scope.id == scopeId)
      : null;
  return (scope = scope || schema.mapScopes[scopeId]);
}

function isScopeFilled(scope, filter) {
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

function mustKeepFilter(filter, schema) {
  if (filter.operator == 'null' || filter.operator == 'not_null') {
    return true;
  }
  if (filter.type == 'scope') {
    const scope = getScopeDefinition(filter.id, schema);
    return scope && isScopeFilled(scope, filter);
  }
  const isEmpty =
    filter.value === undefined ||
    (Array.isArray(filter.value) && filter.value.filter((value) => value !== undefined).length == 0);

  return !(isEmpty && filter.type == 'condition');
}

async function getComputedFilter() {
  const computedFilter = structuredClone(toRaw(props.modelValue));
  const stack = [[computedFilter, schema.value]];
  while (stack.length) {
    const [currentFilter, currentSchema] = stack.pop();
    if (currentFilter.type == 'relationship_condition') {
      if (currentFilter.filter) {
        const schemaId = currentSchema.mapProperties[currentFilter.property].related;
        const childSchema = await resolve(schemaId);
        if (mustKeepFilter(currentFilter.filter, childSchema)) {
          stack.push([currentFilter.filter, childSchema]);
        } else {
          delete currentFilter.filter;
        }
      }
    } else if (currentFilter.type == 'group') {
      const filters = [];
      for (const filter of currentFilter.filters) {
        if (!mustKeepFilter(filter, currentSchema)) {
          continue;
        }
        stack.push([filter, currentSchema]);
        filters.push(filter);
      }
      currentFilter.filters = filters;
    } else {
      if (Array.isArray(currentFilter.value)) {
        currentFilter.value = currentFilter.value.filter((value) => value !== undefined);
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
        if (currentFilter.parameters?.length) {
          for (let i = 0; i < currentFilter.parameters.length; i++) {
            if (Array.isArray(currentFilter.parameters[i])) {
              currentFilter.parameters[i] = currentFilter.parameters[i].filter((v) => v !== undefined);
            }
          }
        }
        const scope = getScopeDefinition(currentFilter.id, currentSchema);
        if (scope.computed) {
          delete currentFilter.id;
          const computedScopeValue = scope.computed(currentFilter.parameters);
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
  <div :id="id" style="position: relative" :class="classes.builder" tabindex="0" :aria-label="translate('filter')">
    <slot name="shortcuts" />
    <Group v-if="schema" v-bind="props" :root="true">
      <template v-if="allowReset" #reset>
        <IconButton icon="reset" @click="reset" />
      </template>
      <template #validate>
        <slot name="validate" />
      </template>
    </Group>
  </div>
</template>
