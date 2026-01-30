<script setup lang="ts">
import { ref, computed, watchEffect, useTemplateRef } from 'vue';
import { getUniqueId } from '@core/Utils';
import ConditionChoice from '@components/Filter/ConditionChoice.vue';
import { resolve, type EntitySchema } from '@core/EntitySchema';
import { useFilterWithOperator } from '@components/Filter/Composable/FilterWithOperator';
import { isValidOperator, type AllowedOperators } from '@core/OperatorManager';
import InvalidOperator from '@components/Messages/InvalidOperator.vue';
import InvalidEntity from '@components/Messages/InvalidEntity.vue';
import AdaptativeSelect from '@components/Common/AdaptativeSelect.vue';
import IconButton from '@components/Common/IconButton.vue';
import CollapseButton from '@components/Common/CollapseButton.vue';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import GroupElement from '@components/Filter/GroupElement.vue';
import type { GroupFilter, Filter, DisplayOperator, AllowedScopes, AllowedProperties } from '@core/types';

interface Props {
  modelValue: GroupFilter;
  entity: string;
  allowedScopes?: AllowedScopes;
  allowedProperties?: AllowedProperties;
  allowedOperators?: AllowedOperators;
  displayOperator?: DisplayOperator;
  userTimezone?: string;
  requestTimezone?: string;
  onReset?: () => void;
  onValidate?: () => void;
}

interface Emits {
  remove: [];
}

defineEmits<Emits>();
const collapsed = defineModel<boolean>('collapsed', { default: false });
const props = withDefaults(defineProps<Props>(), {
  displayOperator: true,
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
});

const validOperator = ref<boolean>(true);
const validEntity = ref<boolean>(true);
const schema = ref<EntitySchema | null>(null);
const showConditionChoice = ref<boolean>(false);
const groupListRef = useTemplateRef<HTMLUListElement>('groupListRef');
const { isRemovable, canAddFilter, canEditOperator, operatorOptions } = useFilterWithOperator(props, schema);

const visibleFilters = computed<Filter[]>(() => {
  return props.modelValue.filters.filter((filter) => isVisible(filter));
});

function initFilter(): void {
  if (!props.modelValue.filters) {
    props.modelValue.filters = [];
  }
  for (const filter of props.modelValue.filters) {
    if (!filter.key) {
      filter.key = getUniqueId();
    }
  }
}

async function initSchema(): Promise<void> {
  schema.value = await resolve(props.entity);
  if (!schema.value) {
    validEntity.value = false;
  }
}

function isVisible(filter: Filter): boolean {
  return !(filter.visible === false);
}

function removeFilter(filter: Filter): void {
  const index = props.modelValue.filters.findIndex((current) => current === filter);
  const visibleIndex = visibleFilters.value.findIndex((current) => current === filter);
  const allTreeitems = groupListRef.value?.querySelectorAll<HTMLElement>('[role="treeitem"]');
  const treeitems = allTreeitems
    ? Array.from(allTreeitems).filter((item) => item.closest('[role="group"]') === groupListRef.value)
    : [];

  if (treeitems.length && visibleIndex !== -1) {
    const targetIndex = visibleIndex < treeitems.length - 1 ? visibleIndex + 1 : visibleIndex - 1;
    if (targetIndex >= 0) {
      treeitems[targetIndex]?.focus();
    } else {
      groupListRef.value?.closest<HTMLElement>('[role="treeitem"]')?.focus();
    }
  }

  props.modelValue.filters.splice(index, 1);
}

function addFilter(): void {
  collapsed.value = false;
  showConditionChoice.value = true;
}

function setNewFilter(data: Filter): void {
  props.modelValue.filters.push(data);
}

watchEffect(() => {
  initFilter();
  initSchema();
});
watchEffect(() => {
  if (!isValidOperator('group', props.modelValue.operator)) {
    validOperator.value = false;
  }
});
</script>

<template>
  <div v-if="!validEntity || !validOperator" :class="classes.condition_error_container">
    <div>
      <InvalidEntity v-if="!validEntity" :entity="props.entity" />
      <InvalidOperator v-else-if="!validOperator" :operator="props.modelValue.operator" />
    </div>
    <IconButton icon="delete" btn-class="btn_secondary" :aria-label="translate('group')" @click="$emit('remove')" />
  </div>
  <div v-else-if="schema" :class="classes.group" data-group>
    <div :class="classes.group_header">
      <div>
        <slot name="relationship" />
      </div>
      <div :class="classes.group_actions">
        <div
          :class="classes.group_resume"
          :collapsed="collapsed ? '' : undefined"
          aria-live="polite"
          aria-atomic="true"
        >
          {{ visibleFilters.length }}
          <span>{{ translate(visibleFilters.length > 1 ? 'filters' : 'filter') }}</span>
        </div>
        <template v-if="displayOperator === true || (displayOperator && displayOperator.group)">
          <AdaptativeSelect
            v-model="modelValue.operator"
            :class="classes.operator"
            :options="operatorOptions"
            :disabled="!canEditOperator"
            :aria-label="translate('operator')"
          />
        </template>
        <IconButton v-if="canAddFilter" icon="add_filter" @click="addFilter" />
        <IconButton v-if="onReset" icon="reset" @click="onReset" />
        <IconButton v-if="onValidate" icon="search" @click="onValidate" />
        <IconButton v-if="isRemovable" icon="delete" :aria-label="translate('group')" @click="$emit('remove')" />
        <CollapseButton v-model:collapsed="collapsed" :aria-label="translate('group')" />
      </div>
    </div>
    <div class="qkit-collapse-wrapper" :collapsed="collapsed ? '' : undefined">
      <div style="overflow: hidden">
        <ul ref="groupListRef" role="group" :class="classes.group_list">
          <TransitionGroup name="qkit-collapse-horizontal-list">
            <GroupElement
              v-for="filter in visibleFilters"
              :key="filter.key"
              v-bind="props"
              :model-value="filter"
              @remove="() => removeFilter(filter)"
            />
          </TransitionGroup>
        </ul>
      </div>
    </div>
    <ConditionChoice v-model:show="showConditionChoice" v-bind="props" @validate="setNewFilter" />
  </div>
</template>
