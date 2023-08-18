<script setup>
import { ref, computed, watchEffect } from 'vue';
import Utils from '../../core/Utils.js';
import ConditionChoice from './ConditionChoice.vue';
import { resolve } from '../../core/Schema';
import { useBaseCondition } from './AbstractCondition';
import { operatorNames } from './FilterManager';
import InvalidOperator from '../Messages/InvalidOperator.vue';
import InvalidModel from '../Messages/InvalidModel.vue';
import AdaptativeSelect from '../Common/AdaptativeSelect.vue';
import IconButton from '../Common/IconButton.vue';
import CollapseButton from '../Common/CollapseButton.vue';
import { classes } from '../../core/ClassManager';
import { translate } from '../../i18n/i18n';
import GroupFilter from './GroupFilter.vue';

const emit = defineEmits(['remove', 'goToRootGroup']);
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  computedScopes: {
    type: Object, // {modelname: [{id: 'scope_one', name: 'scope one', type: 'string', useOperator: true, computed: () => {...})}, ...], ...}
  },
  allowedScopes: {
    type: Object, // {modelname: ['scope_one', 'scope_two', ...], ...}
  },
  allowedProperties: {
    type: Object, // {modelname: ['property_name_one', 'property_name_two', ...], ...}
  },
  allowedOperators: {
    type: Object, // {condition: ['=', '<>', ...], group: ['AND', 'OR'], relationship_condition: ['HAS', 'HAS_NOT']}
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
  root: {
    type: Boolean,
    default: false,
  },
  ariaLabel: {
    type: String,
  },
});

const listRef = ref(null);
const groupRef = ref(null);
const validOperator = ref(true);
const validModel = ref(true);
const schema = ref(null);
const addFilterDialog = ref(null);
const collapsed = ref(false);
const { isRemovable, canAddFilter, canEditOperator, operatorOptions } = useBaseCondition(props, schema, 'group');

const visibleFilters = computed(() => {
  return props.modelValue.filters.filter((filter) => isVisible(filter));
});

const shortcutEvents = {
  goToNext: goToNext,
  goToPrevious: goToPrevious,
  goToParentGroup: focusGroup,
  goToRootGroup: goToRootGroup,
  addFilterToParentGroup: addFilter,
};

function goToNext(key) {
  const index = visibleFilters.value.findIndex((filter) => filter.key == key);
  goToCondition(index + 1);
}

function goToPrevious(key) {
  const index = visibleFilters.value.findIndex((filter) => filter.key == key);
  goToCondition(index - 1);
}

function goToCondition(index) {
  const next = listRef.value.children[index];
  if (next && next.children[0]) {
    next.children[0].focus();
  }
}

function focusGroup() {
  groupRef.value.focus();
}

function goToRootGroup() {
  props.root ? groupRef.value.focus() : emit('goToRootGroup');
}

async function initFilter() {
  if (!props.modelValue.filters) {
    props.modelValue.filters = [];
  }
  for (const filter of props.modelValue.filters) {
    if (!filter.key) {
      filter.key = Utils.getUniqueId();
    }
  }
}

async function initSchema() {
  schema.value = await resolve(props.model);
  if (!schema.value) {
    validModel.value = false;
  }
}

function isVisible(filter) {
  return !(filter.visible === false);
}

function removeFilter(key) {
  const index = props.modelValue.filters.findIndex((filter) => filter.key == key);
  props.modelValue.filters.splice(index, 1);
}

function addFilter() {
  collapsed.value = false;
  addFilterDialog.value.showModal();
}

async function setNewFilter(data) {
  props.modelValue.filters.push(data);
  addFilterDialog.value.close();
}

/**
 * TODO remove this function call when firefox will support css :has pseudo class
 *
 * @param {Object} filter
 */
function hasGroup(filter) {
  while (filter && filter.type == 'relationship_condition') {
    filter = filter.filter;
  }
  return filter && filter.type == 'group';
}

watchEffect(() => {
  initFilter();
  initSchema();
});
watchEffect(() => {
  if (!operatorNames['group'][props.modelValue.operator]) {
    props.modelValue.operator = props.modelValue.operator.toLowerCase();
    if (!operatorNames['group'][props.modelValue.operator]) {
      validOperator.value = false;
    }
  }
});
</script>

<template>
  <div
    v-if="!validModel || !validOperator"
    :class="classes.condition_error_container"
    tabindex="0"
    :aria-label="ariaLabel ?? translate('group')"
  >
    <div>
      <InvalidModel v-if="!validModel" :model="props.model" />
      <InvalidOperator v-else-if="!validOperator" :operator="props.modelValue.operator" />
    </div>
    <IconButton icon="delete" @click="$emit('remove')" :aria-label="translate('group')" />
  </div>
  <div
    ref="groupRef"
    v-else-if="schema"
    :class="classes.group"
    tabindex="0"
    :aria-label="ariaLabel ?? translate('group')"
  >
    <slot name="shortcuts"></slot>
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
            :class="classes.operator"
            v-model="modelValue.operator"
            :options="operatorOptions"
            :disabled="!canEditOperator"
            :aria-label="translate('operator')"
          />
        </template>
        <IconButton v-if="canAddFilter" icon="add_filter" @click="addFilter" />
        <slot name="reset" />
        <slot name="validate" />
        <IconButton v-if="isRemovable" icon="delete" @click="$emit('remove')" :aria-label="translate('group')" />
        <CollapseButton v-model:collapsed="collapsed" :aria-label="translate('group')" />
      </div>
    </div>
    <div class="qkit-collapse-wrapper" :collapsed="collapsed ? '' : undefined">
      <div style="overflow: hidden">
        <ul ref="listRef" :class="classes.group_list">
          <GroupFilter
            v-for="(filter, displayIndex) in visibleFilters"
            :key="filter.key"
            v-bind="props"
            :model-value="filter"
            :except-add-filter-to-parent-group="!canAddFilter"
            :except-go-to-previous="displayIndex == 0"
            :except-go-to-next="displayIndex == visibleFilters.length - 1"
            @remove="() => removeFilter(filter.key)"
            v-on="shortcutEvents"
          />
        </ul>
      </div>
    </div>
    <dialog ref="addFilterDialog" :class="classes.modal">
      <div :class="classes.modal_close_container">
        <IconButton icon="close" @click="() => addFilterDialog.close()" />
      </div>
      <ConditionChoice v-bind="props" @validate="setNewFilter" />
    </dialog>
  </div>
</template>

<style>
.qkit-collapse-wrapper {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.3s ease;
}
.qkit-collapse-wrapper[collapsed] {
  grid-template-rows: 0fr;
}
</style>
