<script setup lang="ts">
import { classes } from '@core/ClassManager';

interface Props {
  type: string;
}

const props = defineProps<Props>();
</script>

<template>
  <span :class="classes.error_info" role="alert">
    invalid type <span>{{ props.type }}</span>
  </span>
</template>
