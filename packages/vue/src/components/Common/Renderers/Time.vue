<script setup>
import { computed } from 'vue';
import { locale } from '../../../i18n/i18n';

const props = defineProps({
  column: {
    type: Object,
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
  return new Date('1970-01-01 ' + props.value).toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
  });
});
</script>

<template>
  {{ computedValue }}
</template>
