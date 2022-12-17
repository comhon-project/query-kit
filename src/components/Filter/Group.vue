<script setup>
import { ref, computed, watchEffect } from 'vue'
import Utils from '../../core/Utils.js'
import Group from './Group.vue';
import Condition from './Condition.vue';
import RelationshipCondition from './RelationshipCondition.vue';
import ConditionChoice from './ConditionChoice.vue';
import { resolve } from '../../core/Schema';
import { useBaseCondition } from './AbstractCondition';
import { operatorNames } from './FilterManager';
import InvalidOperator from '../Messages/InvalidOperator.vue';
import InvalidModel from '../Messages/InvalidModel.vue';
import AdaptativeSelect from '../Common/AdaptativeSelect.vue';
import IconButton from '../Common/IconButton.vue';
import { classes } from '../../core/ClassManager';
import { translate } from '../../i18n/i18n';
import Shortcuts from './Shortcuts.vue';

const emit = defineEmits(['remove', 'goToNext', 'goToPrevious', 'goToParentGroup', 'goToRootGroup', 'addFilterToParentGroup']);
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  model: {
    type: String,
    required: true
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
    default: true
  },
  userTimezone: {
    type: String,
    default: 'UTC'
  },
  requestTimezone: {
    type: String,
    default: 'UTC'
  },
  root: {
    type: Boolean,
    default: false
  },
  ariaLabel: {
    type: String,
  },
  exceptShortcuts: {
    type: Array,
  },
});

const listRef = ref(null);
const groupRef = ref(null);
const validOperator = ref(true);
const validModel = ref(true);
const schema = ref(null);
const addFilterDialog = ref(null);
const { isRemovable, canAddFilter, canEditOperator, operatorOptions } = useBaseCondition(props, schema, 'group');

const visibleFilters = computed(() => {
  let firstVisible = true;
  let lastVisibleIndex = -1;
  const filters = [];
  for (let index = 0; index < props.modelValue.filters.length; index++) {
    if (isVisible(props.modelValue.filters[index])) {
      lastVisibleIndex = index;
    }
  }
  for (let index = 0; index < props.modelValue.filters.length; index++) {
    const filter = props.modelValue.filters[index];
    if (!isVisible(filter)) {
      continue;
    }
    const except = [];
    if (!canAddFilter.value) {
      except.push('addFilterToParentGroup');
    } if (firstVisible) {
      except.push('goToPrevious');
    } if (index == lastVisibleIndex) {
      except.push('goToNext');
    }
    filters.push({ filter, except, index });
    firstVisible = false;
  }
  
  return filters;
});

const shortcutEvents = {
  goToNext: () => emit('goToNext'),
  goToPrevious: () => emit('goToPrevious'),
  goToParentGroup: () => emit('goToParentGroup'),
  goToRootGroup: () => emit('goToRootGroup'),
  addFilterToParentGroup: () => emit('addFilterToParentGroup'),
}

const on = (realIndex, displayIndex) => {return {
  remove: () => removeFilter(realIndex),
  goToNext: () => goToCondition(displayIndex + 1),
  goToPrevious: () => goToCondition(displayIndex - 1),
  goToParentGroup: focusGroup,
  goToRootGroup: goToRootGroup,
  addFilterToParentGroup: addFilter,
}};

function goToCondition(index)
{
  const next = listRef.value.children[index];
  if (next && next.children[0]) {
    next.children[0].focus();
  }
}

function focusGroup()
{
  groupRef.value.focus();
}

function goToRootGroup()
{
  props.root ? groupRef.value.focus() : emit('goToRootGroup');
}

async function initFilter()
{
  if(!props.modelValue.filters) {
    props.modelValue.filters = [];
  }
  for (const filter of props.modelValue.filters) {
    if (!filter.key) {
      filter.key = Utils.getUniqueId();
    }
  }
}

async function initSchema()
{
  schema.value = await resolve(props.model);
  if (!schema.value) {
    validModel.value = false;
  }
}

function isVisible(filter)
{
  return !(filter.visible === false);
}

function removeFilter(index)
{
  props.modelValue.filters.splice(index, 1);
}

function addFilter(index)
{
    addFilterDialog.value.showModal();
}

async function setNewFilter(data)
{
  props.modelValue.filters.push(data);
  addFilterDialog.value.close();
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
  <div v-if="!validModel || !validOperator" :class="classes.condition_error_container" tabindex="0" :aria-label="ariaLabel ?? translate('group')">
      <div>
        <InvalidModel v-if="!validModel" :model="props.model" />
        <InvalidOperator v-else-if="!validOperator" :operator="props.modelValue.operator"/>
      </div>
      <IconButton icon="delete" @click="$emit('remove')" :aria-label="translate('group')"/>
  </div>
  <div ref="groupRef" v-else-if="schema" :class="classes.group" tabindex="0" :aria-label="ariaLabel ?? translate('group')">
    <Shortcuts v-if="!root" v-on="shortcutEvents" :except="exceptShortcuts"/>
    <div :class="classes.group_header">
      <div>
        <slot name="relationship" />
      </div>
      <div :class="classes.group_actions">
        <template v-if="displayOperator === true || (displayOperator && displayOperator.group)">
          <AdaptativeSelect :class="classes.operator" v-model="modelValue.operator" :options="operatorOptions" :disabled="!canEditOperator" :aria-label="translate('operator')"/>
        </template>
        <IconButton v-if="canAddFilter" icon="add_filter" @click="addFilter"/>
        <slot name="reset" />
        <slot name="validate" />
        <template v-if="isRemovable">
          <IconButton icon="delete" @click="$emit('remove')" :aria-label="translate('group')"/>
        </template>
      </div>
    </div>
    <ul ref="listRef" :class="classes.group_list">
      <template v-for="(element, displayIndex) in visibleFilters" :key="element.filter.key">
        <li :style="element.filter.type == 'group' ? {flexBasis: '100%'} : {}">
          <Condition v-if="element.filter.type == 'condition' || element.filter.type == 'scope'" v-bind="props" :model-value="element.filter" v-on="on(element.index, displayIndex)" :aria-label="null" :except-shortcuts="element.except" :root="false"/>
          <RelationshipCondition v-else-if="element.filter.type == 'relationship_condition'" v-bind="props" :model-value="element.filter" v-on="on(element.index, displayIndex)" :aria-label="null" :except-shortcuts="element.except" :root="false"/>
          <Group v-else-if="element.filter.type == 'group'" v-bind="props" :model-value="element.filter" v-on="on(element.index, displayIndex)" :aria-label="null" :except-shortcuts="element.except" :root="false"/>
        </li>
      </template>
    </ul>
    <dialog ref="addFilterDialog" :class="classes.modal">
      <div :class="classes.modal_close_container">
        <IconButton icon="close" @click="() => addFilterDialog.close()"/>
      </div>
      <ConditionChoice v-bind="props" @validate="setNewFilter"/>
    </dialog>
  </div>
</template>
