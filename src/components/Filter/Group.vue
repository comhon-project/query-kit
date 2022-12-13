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

const emit = defineEmits(['remove']);
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
});

const validOperator = ref(true);
const validModel = ref(true);
const schema = ref(null);
const { isRemovable, canAddFilter, canEditOperator, operatorOptions } = useBaseCondition(props, schema, 'group');
const addFilterDialog = ref(null);

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
  <div v-if="!validModel || !validOperator" :class="classes.condition_error_container">
      <div>
        <InvalidModel v-if="!validModel" :model="props.model" />
        <InvalidOperator v-else-if="!validOperator" :operator="props.modelValue.operator"/>
      </div>
      <IconButton icon="delete" @click="$emit('remove')" :aria-label="translate('group')"/>
  </div>
  <div v-else-if="schema" :class="classes.group">
    <div :class="classes.group_header">
      <div>
        <slot name="relationship" />
      </div>
      <div :class="classes.group_actions">
        <template v-if="displayOperator === true || (displayOperator && displayOperator.group)">
          <AdaptativeSelect :class="classes.operator" v-model="modelValue.operator" :options="operatorOptions" :disabled="!canEditOperator" :aria-label="translate('operator')"/>
        </template>
        <template v-if="canAddFilter"><IconButton icon="add_filter" @click="addFilter"/></template>
        <slot name="reset" />
        <slot name="validate" />
        <template v-if="isRemovable">
          <IconButton icon="delete" @click="$emit('remove')" :aria-label="translate('group')"/>
        </template>
      </div>
    </div>
    <ul :class="classes.group_list">
      <template v-for="(filter, index) in modelValue.filters" :key="filter.key">
        <li v-if="isVisible(filter)" :style="filter.type == 'group' ? {flexBasis: '100%'} : {}">
          <Condition v-if="filter.type == 'condition' || filter.type == 'scope'" v-bind="props" :model-value="filter" @remove="() => removeFilter(index)"/>
          <RelationshipCondition v-else-if="filter.type == 'relationship_condition'" v-bind="props" :model-value="filter" @remove="() => removeFilter(index)"/>
          <Group v-else-if="filter.type == 'group'" v-bind="props" :model-value="filter" @remove="() => removeFilter(index)"/>
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
