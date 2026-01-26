<script setup lang="ts">
import { classes } from '@core/ClassManager';

interface Props {
  id: string;
}

const props = defineProps<Props>();
</script>

<template>
  <span :class="classes.error_info" role="alert">
    invalid scope <span>{{ props.id }}</span>
  </span>
</template>
