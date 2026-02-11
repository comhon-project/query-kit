<script setup lang="ts">
import { computed } from 'vue';
import { getLeafTypeContainer, type ArrayableTypeContainer } from '@core/EntitySchema';
import InvalidData from '@components/Messages/InvalidData.vue';

interface Props {
  typeContainer: ArrayableTypeContainer;
}

const props = defineProps<Props>();

const leafType = computed(() => {
  return getLeafTypeContainer(props.typeContainer).type;
});
</script>

<template>
  <InvalidData message-key="invalid_type" :value="leafType" />
</template>
