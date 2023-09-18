<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import { resolve } from '../../../core/Schema';

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
const computedValue = computed(() => {
  const idProp = schema.value.unique_identifier || 'id';
  return schema.value.primary_identifiers
    ? schema.value.primary_identifiers
        .map((property) => {
          const object = props.value || props.rowValue;
          const key = props.value ? property : props.columnId + '.' + property;
          return object[key];
        })
        .join(' ')
    : props.value
    ? props.value[idProp]
    : props.rowValue[props.columnId + '.' + idProp];
});

onBeforeMount(async () => {
  schema.value = await resolve(props.type.model);
});
</script>

<template>
  <template v-if="schema">{{ computedValue }}</template>
</template>
