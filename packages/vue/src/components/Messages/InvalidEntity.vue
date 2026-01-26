<script setup lang="ts">
import { classes } from '@core/ClassManager';

interface Props {
  entity: string;
}

const props = defineProps<Props>();
</script>

<template>
  <span :class="classes.error_info" role="alert">
    invalid entity <span>{{ props.entity }}</span>
  </span>
</template>
