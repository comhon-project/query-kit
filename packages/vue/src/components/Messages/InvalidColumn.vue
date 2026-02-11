<script setup lang="ts">
import InvalidData from '@components/Messages/InvalidData.vue';

interface Props {
  column: string;
}

defineProps<Props>();
</script>

<template>
  <InvalidData message-key="invalid_column" :value="column" />
</template>
