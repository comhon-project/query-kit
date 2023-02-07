<script setup>
import { classes } from '../../core/ClassManager';

const props = defineProps({
  type: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <span :class="classes.error_info">
    invalid type <span>{{ props.type }}</span>
  </span>
</template>
