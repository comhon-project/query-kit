<script setup>
import { config } from '../../../config/config';

const props = defineProps({
  column: {
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
</script>

<template>
  <div v-if="config.renderHtml" v-html="value" />
  <template v-else>{{ value }}</template>
</template>
