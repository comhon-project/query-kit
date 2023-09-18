<script setup>
import { computed } from 'vue';
import { locale } from '../../../i18n/i18n';
import { DateTime } from 'luxon';

const props = defineProps({
  columnId: {
    type: String,
    required: true,
  },
  property: {
    type: Object,
    required: true,
  },
  type: {
    type: Object,
    required: true,
  },
  value: {
    type: undefined,
    required: true,
  },
  rowValue: {
    type: Object,
    required: true,
  },
  requestTimezone: {
    type: String,
    required: true,
  },
  userTimezone: {
    type: String,
    required: true,
  },
});
const computedValue = computed(() => {
  if (!props.value) {
    return null;
  }
  return DateTime.fromISO(props.value, { zone: props.requestTimezone, locale: locale.value })
    .setZone(props.userTimezone)
    .toLocaleString({ year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
});
</script>

<template>
  {{ computedValue }}
</template>
