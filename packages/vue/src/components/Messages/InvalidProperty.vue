<script setup lang="ts">
import InvalidData from '@components/Messages/InvalidData.vue';

interface Props {
  property: string;
}

defineProps<Props>();
</script>

<template>
  <InvalidData message-key="invalid_property" :value="property" />
</template>
