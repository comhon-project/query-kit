<script setup>
import { computed } from 'vue';
import { locale } from '../../../i18n/i18n';

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
  return new Date(props.value).toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
});
</script>

<template>
  {{ computedValue }}
</template>
