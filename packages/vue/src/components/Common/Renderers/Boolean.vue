<script setup>
import { translate } from '../../../i18n/i18n';

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
  {{ value != null ? translate(value ? 'yes' : 'no') : null }}
</template>
