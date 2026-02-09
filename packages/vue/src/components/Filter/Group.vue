<script setup lang="ts">
import { ref, computed, useTemplateRef, onMounted } from 'vue';
import ChildGroup from '@components/Filter/ChildGroup.vue';
import { useTreeNavigation } from '@components/Filter/Composable/TreeNavigation';
import { translate } from '@i18n/i18n';
import type { GroupFilter } from '@core/types';

interface Props {
  modelValue: GroupFilter;
  entity: string;
}

interface Emits {
  exit: [];
}

const emit = defineEmits<Emits>();
const props = defineProps<Props>();

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
      <ChildGroup
        :model-value="modelValue"
        :entity="entity"
        v-model:collapsed="collapsed"
      >
        <template #builder_actions>
          <slot name="builder_actions" />
        </template>
      </ChildGroup>
    </div>
  </div>
</template>
