<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import { resolve } from '../../../core/Schema';

const props = defineProps({
  column: {
    type: Object,
    required: true,
  },
  value: {
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
const computedValue = computed(() => {
  return schema.value.primary_identifiers
    ? schema.value.primary_identifiers.map((property) => props.rowValue[props.column.id + '.' + property]).join(' ')
    : props.rowValue[props.column.id + '.' + (schema.value.unique_identifier || 'id')];
});

onBeforeMount(async () => {
  schema.value = await resolve(props.column.property.model);
});
</script>

<template>
  <template v-if="schema">{{ computedValue }}</template>
</template>
