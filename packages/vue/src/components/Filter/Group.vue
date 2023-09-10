<script setup>
import { ref, computed, watchEffect } from 'vue';
import Utils from '../../core/Utils.js';
import ConditionChoice from './ConditionChoice.vue';
import { resolve } from '../../core/Schema';
import { useBaseFilter } from './Composable/BaseFilter';
import { isValidOperator } from '../../core/OperatorManager';
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
    default: undefined,
  },
  allowedScopes: {
    type: Object, // {modelname: ['scope_one', 'scope_two', ...], ...}
    default: undefined,
  },
  allowedProperties: {
    type: Object, // {modelname: ['property_name_one', 'property_name_two', ...], ...}
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
  root: {
    type: Boolean,
    default: false,
  },
  ariaLabel: {
    type: String,
    default: undefined,
  },
});

const listRef = ref(null);
const groupRef = ref(null);
const validOperator = ref(true);
const validModel = ref(true);
const schema = ref(null);
const showConditionChoice = ref(false);
const collapsed = ref(false);
const { isRemovable, canAddFilter, canEditOperator, operatorOptions } = useBaseFilter(props, schema, 'group');

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
  showConditionChoice.value = true;
}

async function setNewFilter(data) {
  props.modelValue.filters.push(data);
}

watchEffect(() => {
  initFilter();
  initSchema();
});
watchEffect(() => {
  if (!isValidOperator('group', props.modelValue.operator, false)) {
    validOperator.value = false;
  } else if (!isValidOperator('group', props.modelValue.operator, true)) {
    props.modelValue.operator = props.modelValue.operator.toLowerCase();
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
          <GroupFilter
            v-for="(filter, displayIndex) in visibleFilters"
            :key="filter.key"
            v-bind="props"
            :model-value="filter"
            :root="undefined"
            :aria-label="undefined"
            :except-add-filter-to-parent-group="!canAddFilter"
            :except-go-to-previous="displayIndex == 0"
            :except-go-to-next="displayIndex == visibleFilters.length - 1"
            @remove="() => removeFilter(filter.key)"
            v-on="shortcutEvents"
          />
        </ul>
      </div>
    </div>
    <ConditionChoice v-model:show="showConditionChoice" v-bind="props" @validate="setNewFilter" />
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
