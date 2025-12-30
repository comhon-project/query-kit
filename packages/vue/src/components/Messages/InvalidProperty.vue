<script setup>
import { classes } from '@core/ClassManager';

const props = defineProps({
  property: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <span :class="classes.error_info">
    invalid property <span>{{ props.property }}</span>
  </span>
</template>
