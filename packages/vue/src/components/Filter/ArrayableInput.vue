<script setup lang="ts">
import { computed } from 'vue';
import CollectionInput from '@components/Filter/CollectionInput.vue';
import UniqueInput from '@components/Filter/UniqueInput.vue';
import { supportsMultiple } from '@core/InputManager';
import type { ArrayableTypeContainer } from '@core/EntitySchema';

interface Props {
  target: ArrayableTypeContainer;
  entity: string;
  editable?: boolean;
  userTimezone?: string;
  requestTimezone?: string;
  isArray?: boolean;
}

const modelValue = defineModel<unknown>();

const props = withDefaults(defineProps<Props>(), {
  editable: true,
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
  isArray: false,
});

const containerType = computed<ArrayableTypeContainer>(() => {
  let container: ArrayableTypeContainer = props.target;
  while (container.type === 'array' && container.children) {
    container = container.children;
  }
  return container;
});

const componentSupportsMultiple = computed(() => supportsMultiple(containerType.value));

const useCollection = computed(() => {
  return props.isArray && !componentSupportsMultiple.value;
});

const isMultiple = computed(() => {
  return props.isArray && componentSupportsMultiple.value;
});
</script>

<template>
  <CollectionInput v-if="useCollection" v-bind="props" v-model="modelValue as unknown[]" />
  <UniqueInput v-else v-bind="props" v-model="modelValue" :multiple="isMultiple" />
</template>
