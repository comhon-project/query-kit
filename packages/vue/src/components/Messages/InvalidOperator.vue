<script setup lang="ts">
import { classes } from '@core/ClassManager';

interface Props {
  operator: string;
}

const props = defineProps<Props>();
</script>

<template>
  <span :class="classes.error_info">
    invalid operator <span>{{ props.operator }}</span>
  </span>
</template>
