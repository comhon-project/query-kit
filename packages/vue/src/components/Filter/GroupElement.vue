<script setup lang="ts">
import { computed, type Component } from 'vue';
import Condition from '@components/Filter/Condition.vue';
import Scope from '@components/Filter/Scope.vue';
import RelationshipCondition from '@components/Filter/RelationshipCondition.vue';
import Group from '@components/Filter/Group.vue';
import { classes } from '@core/ClassManager';
import type { AllowedOperators } from '@core/OperatorManager';
import type { Filter, DisplayOperator, AllowedScopes, AllowedProperties } from '@core/types';

interface Props {
  modelValue: Filter;
  entity: string;
  allowedScopes?: AllowedScopes;
  allowedProperties?: AllowedProperties;
  allowedOperators?: AllowedOperators;
  displayOperator?: DisplayOperator;
  userTimezone?: string;
  requestTimezone?: string;
  ariaLabel?: string; // not used but avoid prop to be injected automatically by vue on first template html node
}

interface Emits {
  remove: [key: string | number | undefined];
}

defineEmits<Emits>();
const props = withDefaults(defineProps<Props>(), {
  displayOperator: true,
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
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
  <li role="none" :class="classes.group_list_element">
    <component
      :is="component"
      v-bind="props"
      :model-value="modelValue"
      @remove="$emit('remove', modelValue.key)"
    />
  </li>
</template>
