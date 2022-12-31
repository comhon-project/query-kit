<script setup>
import { classes } from '../../core/ClassManager';


const props = defineProps({
  model: {
    type: String,
    required: true
  },
});

</script>

<template>
  <span :class="classes.error_info">
    invalid model <span>{{ props.model }}</span>
  </span>
</template>
