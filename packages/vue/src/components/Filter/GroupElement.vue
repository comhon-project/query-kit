<script setup lang="ts">
import { ref, computed, type Component } from 'vue';
import Condition from '@components/Filter/Condition.vue';
import Scope from '@components/Filter/Scope.vue';
import RelationshipCondition from '@components/Filter/RelationshipCondition.vue';
import ChildGroup from '@components/Filter/ChildGroup.vue';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import type { Filter } from '@core/types';

interface Props {
  modelValue: Filter;
  entity: string;
}

interface Emits {
  remove: [key: string | number | undefined];
}

defineEmits<Emits>();
const props = defineProps<Props>();

const collapsed = ref<boolean>(false);

function hasExpandableContent(filter: Filter): boolean {
  if (filter.type === 'group') return true;
  if (filter.type === 'relationship_condition' && filter.filter) {
    return hasExpandableContent(filter.filter);
  }
  return false;
}

const isExpandable = computed<boolean>(() => hasExpandableContent(props.modelValue));
const ariaExpanded = computed<boolean | undefined>(() => (isExpandable.value ? !collapsed.value : undefined));

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
      return ChildGroup;
    default:
      throw new Error('invalid type ' + type);
  }
});

function toggleCollapse(): void {
  collapsed.value = !collapsed.value;
}
</script>

<template>
  <li
    role="treeitem"
    :tabindex="-1"
    @tree-toggle="toggleCollapse"
    :aria-expanded="ariaExpanded"
    :aria-label="translate(modelValue.type)"
    :class="classes.group_list_element"
  >
    <component
      :is="component"
      :model-value="modelValue"
      :entity="entity"
      v-model:collapsed="collapsed"
      @remove="$emit('remove', modelValue.key)"
    />
  </li>
</template>
