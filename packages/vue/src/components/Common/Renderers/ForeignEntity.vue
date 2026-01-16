<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue';
import { resolve, type EntitySchema } from '@core/EntitySchema';
import type { CellRendererProps } from '@core/types';

const props = defineProps<CellRendererProps>();

const schema = ref<EntitySchema | null>(null);

const computedValue = computed<unknown>(() => {
  if (!schema.value) return null;
  const idProp = schema.value.unique_identifier || 'id';
  return schema.value.primary_identifiers
    ? schema.value.primary_identifiers
        .map((property: string) => {
          const object = (props.value || props.rowValue) as Record<string, unknown>;
          const key = props.value ? property : props.columnId + '.' + property;
          return object[key];
        })
        .join(' ')
    : props.value
    ? (props.value as Record<string, unknown>)[idProp]
    : props.rowValue[props.columnId + '.' + idProp];
});

onBeforeMount(async () => {
  const related = props.property.related;
  if (related) {
    schema.value = await resolve(related);
  }
});
</script>

<template>
  <template v-if="schema">{{ computedValue }}</template>
</template>
