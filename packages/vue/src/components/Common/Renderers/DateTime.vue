<script setup lang="ts">
import { computed } from 'vue';
import { locale } from '@i18n/i18n';
import { DateTime } from 'luxon';
import type { CellRendererProps } from '@core/types';

const props = defineProps<CellRendererProps>();

const computedValue = computed<string | null>(() => {
  if (!props.value) {
    return null;
  }
  return DateTime.fromISO(props.value as string, { zone: props.requestTimezone, locale: locale.value })
    .setZone(props.userTimezone)
    .toLocaleString({ year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
});
</script>

<template>
  {{ computedValue }}
</template>
