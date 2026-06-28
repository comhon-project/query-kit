<script setup lang="ts">
import InvalidData from '@components/Messages/InvalidData.vue';

interface Props {
  field: string;
}

defineProps<Props>();
</script>

<template>
  <InvalidData message-key="invalid_field" :value="field" />
</template>
