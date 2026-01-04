<script setup>
import { ref, computed, watchEffect } from 'vue';
import { getTranslation, resolve } from '@core/EnumSchema';

const props = defineProps({
  columnId: {
    type: String,
    required: true,
  },
  property: {
    type: Object,
    required: true,
  },
  type: {
    type: Object,
    required: true,
  },
  value: {
    type: undefined,
    required: true,
  },
  rowValue: {
    type: Object,
    required: true,
  },
  requestTimezone: {
    type: String,
    required: true,
  },
  userTimezone: {
    type: String,
    required: true,
  },
});

const cases = ref({});

watchEffect(async () => {
  const schema = await resolve(props.type.enum);
  cases.value = schema.mapCases;
});

const translation = computed(() => {
  const caseItem = cases.value[props.value];
  return caseItem ? getTranslation(caseItem) : null;
});
</script>

<template>
  {{ translation }}
</template>
