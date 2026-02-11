<script setup lang="ts">
import InvalidData from '@components/Messages/InvalidData.vue';

interface Props {
  entity: string;
}

defineProps<Props>();
</script>

<template>
  <InvalidData message-key="invalid_entity" :value="entity" />
</template>
