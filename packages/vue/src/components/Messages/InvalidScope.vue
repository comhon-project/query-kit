<script setup lang="ts">
import InvalidData from '@components/Messages/InvalidData.vue';

interface Props {
  id: string;
}

defineProps<Props>();
</script>

<template>
  <InvalidData message-key="invalid_scope" :value="id" />
</template>
