<script setup lang="ts">
import { ref, computed, useTemplateRef, onMounted } from 'vue';
import ChildGroup from '@components/Filter/ChildGroup.vue';
import { useTreeNavigation } from '@components/Filter/Composable/TreeNavigation';
import { translate } from '@i18n/i18n';
import type { AllowedOperators } from '@core/OperatorManager';
import type { GroupFilter, DisplayOperator, AllowedScopes, AllowedProperties } from '@core/types';

interface Props {
  modelValue: GroupFilter;
  entity: string;
  allowedScopes?: AllowedScopes;
  allowedProperties?: AllowedProperties;
  allowedOperators?: AllowedOperators;
  displayOperator?: DisplayOperator;
  userTimezone?: string;
  requestTimezone?: string;
}

interface Emits {
  remove: [];
  exit: [];
}

const emit = defineEmits<Emits>();
const props = withDefaults(defineProps<Props>(), {
  displayOperator: true,
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
});

const collapsed = ref<boolean>(false);
const ariaExpanded = computed<boolean>(() => !collapsed.value);

const treeRef = useTemplateRef<HTMLElement>('treeRef');
const { handleKeydown, initTabindex } = useTreeNavigation(treeRef, () => emit('exit'));

function toggleCollapse(): void {
  collapsed.value = !collapsed.value;
}

onMounted(() => {
  initTabindex();
});
</script>

<template>
  <div ref="treeRef" role="tree" @keydown="handleKeydown">
    <div
      role="treeitem"
      :tabindex="-1"
      :aria-expanded="ariaExpanded"
      :aria-label="translate('group')"
      @tree-toggle="toggleCollapse"
    >
      <ChildGroup v-bind="props" v-model:collapsed="collapsed" @remove="$emit('remove')">
        <template #reset><slot name="reset" /></template>
        <template #validate><slot name="validate" /></template>
      </ChildGroup>
    </div>
  </div>
</template>
