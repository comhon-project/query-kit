<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue';
import { resolve, type EntitySchema } from '@core/EntitySchema';
import { getNestedValue } from '@core/Utils';
import type { CellRendererProps } from '@core/types';

const props = defineProps<CellRendererProps>();

const schema = ref<EntitySchema | null>(null);

const computedValue = computed<unknown>(() => {
  if (!schema.value || !props.value) return null;
  const value = props.value as Record<string, unknown>;
  return schema.value.primary_identifiers
    ? schema.value.primary_identifiers.map((property: string) => value[property]).join(' ')
    : value[schema.value.unique_identifier ?? ''];
});

onBeforeMount(async () => {
  const entityId = props.property.relationship_type === 'morph_to'
    ? getNestedValue(props.rowValue, props.columnId + '_type') as string | undefined
    : props.property.entity;
  if (entityId) {
    schema.value = await resolve(entityId);
  }
});
</script>

<template>
  <template v-if="schema">{{ computedValue }}</template>
</template>
