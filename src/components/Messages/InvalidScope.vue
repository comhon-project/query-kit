<script setup>
import { classes } from '../../core/ClassManager';

const props = defineProps({
  id: {
    type: String,
    required: true
  },
});

</script>

<template>
  <span :class="classes.error_info">
    invalid scope <span>{{ props.id }}</span>
  </span>
</template>
