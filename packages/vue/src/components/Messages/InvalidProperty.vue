<script setup lang="ts">
import { classes } from '@core/ClassManager';

interface Props {
  property: string;
}

const props = defineProps<Props>();
</script>

<template>
  <span :class="classes.error_info">
    invalid property <span>{{ props.property }}</span>
  </span>
</template>
