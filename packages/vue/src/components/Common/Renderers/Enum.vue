<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { getTranslation, resolve, type EnumCase } from '@core/EnumSchema';
import type { CellRendererProps } from '@core/types';

const props = defineProps<CellRendererProps>();

const cases = ref<Record<string, EnumCase>>({});

watchEffect(async () => {
  const schema = await resolve(props.type.enum!);
  cases.value = schema.mapCases;
});

const translation = computed<string | null>(() => {
  const caseItem = cases.value[props.value as string];
  return caseItem ? getTranslation(caseItem) : null;
});
</script>

<template>
  {{ translation }}
</template>
