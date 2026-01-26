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
  root?: boolean;
  ariaLabel?: string;
}

interface Emits {
  remove: [];
  goToRootGroup: [];
}

const emit = defineEmits<Emits>();
const props = withDefaults(defineProps<Props>(), {
  displayOperator: true,
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
  root: false,
});

const listRef = useTemplateRef<HTMLUListElement>('listRef');
const groupRef = useTemplateRef<HTMLDivElement>('groupRef');
const validOperator = ref<boolean>(true);
const validEntity = ref<boolean>(true);
const schema = ref<EntitySchema | null>(null);
const showConditionChoice = ref<boolean>(false);
const collapsed = ref<boolean>(false);
const { isRemovable, canAddFilter, canEditOperator, operatorOptions } = useFilterWithOperator(props, schema);

const visibleFilters = computed<Filter[]>(() => {
  return props.modelValue.filters.filter((filter) => isVisible(filter));
});

const shortcutEvents = {
  goToNext: goToNext,
  goToPrevious: goToPrevious,
  goToParentGroup: focusGroup,
  goToRootGroup: goToRootGroup,
  addFilterToParentGroup: addFilter,
};

function goToNext(key: string | number): void {
  const index = visibleFilters.value.findIndex((filter) => filter.key == key);
  goToCondition(index + 1);
}

function goToPrevious(key: string | number): void {
  const index = visibleFilters.value.findIndex((filter) => filter.key == key);
  goToCondition(index - 1);
}

function goToCondition(index: number): void {
  const next = listRef.value?.children[index];
  if (next && next.children[0]) {
    (next.children[0] as HTMLElement).focus();
  }
}

function focusGroup(): void {
  groupRef.value?.focus();
}

function goToRootGroup(): void {
  props.root ? groupRef.value?.focus() : emit('goToRootGroup');
}

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
  <div
    v-if="!validEntity || !validOperator"
    :class="classes.condition_error_container"
    tabindex="0"
    :aria-label="ariaLabel ?? translate('group')"
  >
    <div>
      <InvalidEntity v-if="!validEntity" :entity="props.entity" />
      <InvalidOperator v-else-if="!validOperator" :operator="props.modelValue.operator" />
    </div>
    <IconButton icon="delete" btn-class="btn_secondary" :aria-label="translate('group')" @click="$emit('remove')" />
  </div>
  <div
    v-else-if="schema"
    ref="groupRef"
    :class="classes.group"
    tabindex="0"
    :aria-label="ariaLabel ?? translate('group')"
  >
    <slot name="shortcuts" />
    <div :class="classes.group_header">
      <div>
        <slot name="relationship" />
      </div>
      <div :class="classes.group_actions">
        <div :class="classes.group_resume" :collapsed="collapsed ? '' : undefined">
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
        <slot name="reset" />
        <slot name="validate" />
        <IconButton v-if="isRemovable" icon="delete" :aria-label="translate('group')" @click="$emit('remove')" />
        <CollapseButton v-model:collapsed="collapsed" :aria-label="translate('group')" />
      </div>
    </div>
    <div class="qkit-collapse-wrapper" :collapsed="collapsed ? '' : undefined">
      <div style="overflow: hidden">
        <ul ref="listRef" :class="classes.group_list">
          <TransitionGroup name="qkit-collapse-horizontal-list">
            <GroupElement
              v-for="(filter, displayIndex) in visibleFilters"
              :key="filter.key"
              v-bind="props"
              :model-value="filter"
              :root="undefined"
              :aria-label="undefined"
              :except-add-filter-to-parent-group="!canAddFilter"
              :except-go-to-previous="displayIndex == 0"
              :except-go-to-next="displayIndex == visibleFilters.length - 1"
              @remove="() => removeFilter(filter)"
              v-on="shortcutEvents"
            />
          </TransitionGroup>
        </ul>
      </div>
    </div>
    <ConditionChoice v-model:show="showConditionChoice" v-bind="props" @validate="setNewFilter" />
  </div>
</template>
