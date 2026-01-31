<script setup lang="ts">
import { computed } from 'vue';
import { classes } from '@core/ClassManager';
import { getLeafTypeContainer, type ArrayableTypeContainer } from '@core/EntitySchema';

interface Props {
  typeContainer: ArrayableTypeContainer;
}

const props = defineProps<Props>();

const leafType = computed(() => {
  const leaf = getLeafTypeContainer(props.typeContainer);
  return leaf.type;
});
</script>

<template>
  <span :class="classes.error_info" role="alert">
    invalid type <span>{{ leafType }}</span>
  </span>
</template>
