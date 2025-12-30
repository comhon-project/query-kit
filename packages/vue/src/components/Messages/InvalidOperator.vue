<script setup>
import { classes } from '@core/ClassManager';

const props = defineProps({
  operator: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <span :class="classes.error_info">
    invalid operator <span>{{ props.operator }}</span>
  </span>
</template>
