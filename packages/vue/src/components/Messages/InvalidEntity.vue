<script setup>
import { classes } from '@core/ClassManager';

const props = defineProps({
  entity: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <span :class="classes.error_info">
    invalid entity <span>{{ props.entity }}</span>
  </span>
</template>
