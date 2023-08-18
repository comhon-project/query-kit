<script setup>
import { computed } from 'vue';
import Shortcuts from './Shortcuts.vue';
import Condition from './Condition.vue';
import RelationshipCondition from './RelationshipCondition.vue';
import Group from './Group.vue';

const emit = defineEmits([
  'remove',
  'goToNext',
  'goToPrevious',
  'goToParentGroup',
  'goToRootGroup',
  'addFilterToParentGroup',
]);
const props = defineProps({
  modelValue: {
    type: Object,
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
  exceptAddFilterToParentGroup: {
    type: Boolean,
  },
  exceptGoToPrevious: {
    type: Boolean,
  },
  exceptGoToNext: {
    type: Boolean,
  },
});

const shortcutEvents = {
  goToNext: () => emit('goToNext', props.modelValue.key),
  goToPrevious: () => emit('goToPrevious', props.modelValue.key),
  goToParentGroup: () => emit('goToParentGroup'),
  goToRootGroup: () => emit('goToRootGroup'),
  addFilterToParentGroup: () => emit('addFilterToParentGroup'),
};
const filteredShortcutEvents = computed(() => {
  if (!props.exceptAddFilterToParentGroup && !props.exceptGoToPrevious && !props.exceptGoToNext) {
    return shortcutEvents;
  }
  const values = { ...shortcutEvents };
  if (props.exceptAddFilterToParentGroup) {
    delete values.addFilterToParentGroup;
  }
  if (props.exceptGoToPrevious) {
    delete values.goToPrevious;
  }
  if (props.exceptGoToNext) {
    delete values.goToNext;
  }
  return values;
});
/**
 * TODO remove this function call when firefox will support css :has pseudo class
 *
 * @param {Object} filter
 */
const hasGroup = computed(() => {
  let filter = props.modelValue;
  while (filter && filter.type == 'relationship_condition') {
    filter = filter.filter;
  }
  return filter && filter.type == 'group';
});
</script>

<template>
  <li :style="hasGroup ? { flexBasis: '100%' } : {}">
    <component
      :is="
        modelValue.type == 'condition' || modelValue.type == 'scope'
          ? Condition
          : modelValue.type == 'relationship_condition'
          ? RelationshipCondition
          : modelValue.type == 'group'
          ? Group
          : null
      "
      v-bind="props"
      :model-value="modelValue"
      @remove="$emit('remove', modelValue.key)"
      @go-to-root-group="$emit('goToRootGroup')"
    >
      <template #shortcuts>
        <Shortcuts v-on="filteredShortcutEvents" />
      </template>
    </component>
  </li>
</template>
