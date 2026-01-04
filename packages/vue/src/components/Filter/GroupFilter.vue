<script setup>
import { computed, ref } from 'vue';
import Shortcuts from '@components/Filter/Shortcuts.vue';
import Condition from '@components/Filter/Condition.vue';
import Scope from '@components/Filter/Scope.vue';
import RelationshipCondition from '@components/Filter/RelationshipCondition.vue';
import Group from '@components/Filter/Group.vue';
import { classes } from '@core/ClassManager';

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
    required: true,
  },
  entity: {
    type: String,
    required: true,
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
  exceptAddFilterToParentGroup: {
    type: Boolean,
  },
  exceptGoToPrevious: {
    type: Boolean,
  },
  exceptGoToNext: {
    type: Boolean,
  },
  ariaLabel: {
    // not used but avoid prop to be injected automatically by vue on first template html node
    type: String,
    default: undefined,
  },
});

/**
 * polyfill for browser that don't support css pseudo-class :has() like firefox.
 * remove this following ref when all browser support :has().
 */
const isTogglingGroup = ref(false);

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

const component = computed(() => {
  switch (props.modelValue.type) {
    case 'condition':
      return Condition;
    case 'scope':
      return Scope;
    case 'relationship_condition':
      return RelationshipCondition;
    case 'group':
      return Group;
    default:
      return null;
  }
});

/**
 * polyfill for browser that don't support css pseudo-class :has() like firefox.
 * remove following computed value when all browser support :has().
 */
const hasGroup = computed(() => {
  let filter = props.modelValue;
  while (filter && filter.type == 'relationship_condition') {
    filter = filter.filter;
  }
  const has = filter && filter.type == 'group';
  return isTogglingGroup.value ? !has : has;
});

/**
 * polyfill for browser that don't support css pseudo-class :has() like firefox.
 * remove following function when all browser support :has().
 * remove the event listeners too (@transition-group)
 */
function polyfillTransitionGroup() {
  isTogglingGroup.value = true;
  setTimeout(() => {
    isTogglingGroup.value = false;
  }, 600); // the time of transition (2 * 0.3s)
}
</script>

<template>
  <li :class="classes.group_list_element" :has-group="hasGroup ? '' : undefined">
    <component
      :is="component"
      v-bind="props"
      :model-value="modelValue"
      @remove="$emit('remove', modelValue.key)"
      @go-to-root-group="$emit('goToRootGroup')"
      @transition-group="polyfillTransitionGroup"
    >
      <template #shortcuts>
        <Shortcuts v-on="filteredShortcutEvents" />
      </template>
    </component>
  </li>
</template>
