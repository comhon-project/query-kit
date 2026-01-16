<script setup lang="ts">
import { computed } from 'vue';
import { locale } from '@i18n/i18n';
import type { CellRendererProps } from '@core/types';

const props = defineProps<CellRendererProps>();

const computedValue = computed<string | null>(() => {
  if (!props.value) {
    return null;
  }
  return new Date('1970-01-01 ' + props.value).toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
  });
});
</script>

<template>
  {{ computedValue }}
</template>
