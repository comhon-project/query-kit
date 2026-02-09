<script setup lang="ts">
import { computed } from 'vue';
import CollectionInput from '@components/Filter/CollectionInput.vue';
import UniqueInput from '@components/Filter/UniqueInput.vue';
import { supportsMultiple } from '@core/InputManager';
import type { Property, RawScopeParameter, EntitySchema } from '@core/EntitySchema';

interface Props {
  target: Property | RawScopeParameter;
  entitySchema: EntitySchema;
  editable?: boolean;
  isArray?: boolean;
}

const modelValue = defineModel<unknown>();

const props = withDefaults(defineProps<Props>(), {
  editable: true,
  isArray: false,
});

const componentSupportsMultiple = computed(() => supportsMultiple(props.target));

const useCollection = computed(() => {
  return props.isArray && !componentSupportsMultiple.value;
});

const isMultiple = computed(() => {
  return props.isArray && componentSupportsMultiple.value;
});
</script>

<template>
  <CollectionInput
    v-if="useCollection"
    v-model="modelValue as unknown[]"
    :target="target"
    :entity-schema="entitySchema"
    :editable="editable"
  />
  <UniqueInput
    v-else
    v-model="modelValue"
    :target="target"
    :entity-schema="entitySchema"
    :editable="editable"
    :multiple="isMultiple"
  />
</template>
