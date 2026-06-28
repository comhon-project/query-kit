<script setup lang="ts">
import { computed } from 'vue';
import { locale } from '@i18n/i18n';
import type { FieldRendererProps } from '@core/types';

const props = defineProps<FieldRendererProps>();

const computedValue = computed<string | null>(() => {
  if (!props.value) {
    return null;
  }
  return new Date(props.value as string).toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
});
</script>

<template>
  {{ computedValue }}
</template>
