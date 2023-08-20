<script setup>
import { computed } from 'vue';

const props = defineProps({
  column: {
    type: Object,
    required: true,
  },
  value: {
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
</script>

<template>
  {{ props.column.property.enum[props.value] }}
</template>
