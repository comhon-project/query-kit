<script setup lang="ts">
import { ref, computed, watchEffect, useTemplateRef, inject } from 'vue';
import ConditionChoice from '@components/Filter/ConditionChoice.vue';
import type { EntitySchema } from '@core/EntitySchema';
import { useFilterWithOperator } from '@components/Filter/Composable/FilterWithOperator';
import { useSearchable } from '@components/Filter/Composable/Searchable';
import { isValidOperator } from '@core/OperatorManager';
import InvalidOperator from '@components/Messages/InvalidOperator.vue';
import AdaptativeSelect from '@components/Common/AdaptativeSelect.vue';
import IconButton from '@components/Common/IconButton.vue';
import CollapseButton from '@components/Common/CollapseButton.vue';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import GroupElement from '@components/Filter/GroupElement.vue';
import { type GroupFilter, type Filter } from '@core/types';
import { builderConfigKey } from '@core/InjectionKeys';

interface Props {
  modelValue: GroupFilter;
  entitySchema: EntitySchema;
}

interface Emits {
  remove: [];
}

defineEmits<Emits>();
const collapsed = defineModel<boolean>('collapsed', { default: false });
const props = defineProps<Props>();
const config = inject(builderConfigKey)!;

const validOperator = ref<boolean>(true);
const showConditionChoice = ref<boolean>(false);
const groupListRef = useTemplateRef<HTMLUListElement>('groupListRef');
const { isRemovable, isEditable, canEditOperator, operatorOptions } = useFilterWithOperator(config, props);
const { hasSearchableItems } = useSearchable(config, props);

const visibleFilters = computed<Filter[]>(() => {
  return props.modelValue.filters.filter((filter) => isVisible(filter));
});

function isVisible(filter: Filter): boolean {
  return filter.visible !== false;
}

function removeFilter(filter: Filter): void {
  const index = props.modelValue.filters.indexOf(filter);
  const visibleIndex = visibleFilters.value.indexOf(filter);
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
  validOperator.value = isValidOperator('group', props.modelValue.operator);
});
</script>

<template>
  <div v-if="!validOperator" :class="classes.condition_error_container">
    <div>
      <InvalidOperator :operator="props.modelValue.operator" />
    </div>
    <IconButton icon="delete" btn-class="btn_danger" :aria-label="translate('group')" @click="$emit('remove')" />
  </div>
  <div v-else :class="classes.group" data-group>
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
        <template v-if="config.displayOperator === true || (config.displayOperator && config.displayOperator.group)">
          <AdaptativeSelect
            v-model="modelValue.operator"
            :class="classes.operator"
            :options="operatorOptions"
            :disabled="!canEditOperator"
            :aria-label="translate('operator')"
          />
        </template>
        <IconButton v-if="hasSearchableItems && isEditable" icon="add_filter" @click="addFilter" />
        <slot name="builder_actions" />
        <IconButton v-if="isRemovable" icon="delete" :aria-label="translate('group')" @click="$emit('remove')" />
        <CollapseButton v-model:collapsed="collapsed" :aria-label="translate('group')" />
      </div>
    </div>
    <div class="qkit-collapse-wrapper" :collapsed="collapsed ? '' : undefined" :inert="collapsed">
      <div style="overflow: hidden">
        <ul ref="groupListRef" role="group" :class="classes.group_list">
          <TransitionGroup name="qkit-collapse-horizontal-list">
            <GroupElement
              v-for="filter in visibleFilters"
              :key="filter.key"
              :model-value="filter"
              :entity-schema="entitySchema"
              @remove="() => removeFilter(filter)"
            />
          </TransitionGroup>
        </ul>
      </div>
    </div>
    <ConditionChoice v-model:show="showConditionChoice" :entity-schema="entitySchema" @validate="setNewFilter" />
  </div>
</template>
