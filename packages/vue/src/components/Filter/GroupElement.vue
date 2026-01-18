<script setup lang="ts">
import { computed, type Component } from 'vue';
import Shortcuts from '@components/Filter/Shortcuts.vue';
import Condition from '@components/Filter/Condition.vue';
import Scope from '@components/Filter/Scope.vue';
import RelationshipCondition from '@components/Filter/RelationshipCondition.vue';
import Group from '@components/Filter/Group.vue';
import { classes } from '@core/ClassManager';
import type { AllowedOperators, ComputedScopes } from '@core/OperatorManager';
import type { Filter, DisplayOperator, AllowedScopes, AllowedProperties } from '@core/types';

interface Props {
  modelValue: Filter;
  entity: string;
  computedScopes?: ComputedScopes;
  allowedScopes?: AllowedScopes;
  allowedProperties?: AllowedProperties;
  allowedOperators?: AllowedOperators;
  displayOperator?: DisplayOperator;
  userTimezone?: string;
  requestTimezone?: string;
  exceptAddFilterToParentGroup?: boolean;
  exceptGoToPrevious?: boolean;
  exceptGoToNext?: boolean;
  ariaLabel?: string; // not used but avoid prop to be injected automatically by vue on first template html node
}

interface Emits {
  remove: [key: string | number | undefined];
  goToNext: [key: string | number | undefined];
  goToPrevious: [key: string | number | undefined];
  goToParentGroup: [];
  goToRootGroup: [];
  addFilterToParentGroup: [];
}

const emit = defineEmits<Emits>();
const props = withDefaults(defineProps<Props>(), {
  displayOperator: true,
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
});

type ShortcutEvents = {
  goToNext?: () => void;
  goToPrevious?: () => void;
  goToParentGroup: () => void;
  goToRootGroup: () => void;
  addFilterToParentGroup?: () => void;
};

const shortcutEvents: ShortcutEvents = {
  goToNext: () => emit('goToNext', props.modelValue.key),
  goToPrevious: () => emit('goToPrevious', props.modelValue.key),
  goToParentGroup: () => emit('goToParentGroup'),
  goToRootGroup: () => emit('goToRootGroup'),
  addFilterToParentGroup: () => emit('addFilterToParentGroup'),
};

const filteredShortcutEvents = computed<ShortcutEvents>(() => {
  if (!props.exceptAddFilterToParentGroup && !props.exceptGoToPrevious && !props.exceptGoToNext) {
    return shortcutEvents;
  }
  const values: ShortcutEvents = { ...shortcutEvents };
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

const component = computed<Component>(() => {
  const type = props.modelValue.type;
  switch (type) {
    case 'condition':
      return Condition;
    case 'scope':
      return Scope;
    case 'relationship_condition':
      return RelationshipCondition;
    case 'group':
      return Group;
    default:
      throw new Error('invalid type ' + type);
  }
});
</script>

<template>
  <li :class="classes.group_list_element">
    <component
      :is="component"
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
