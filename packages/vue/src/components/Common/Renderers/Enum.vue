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

const schema = ref(null);

watchEffect(async () => {
  schema.value = await resolve(props.type.enum);
});

const translation = computed(() => {
  return schema.value ? getTranslation(props.type.enum, props.value) : null;
});
</script>

<template>
  {{ translation }}
</template>
