<script setup>
import { computed } from 'vue';
import { getRenderer } from '../../../core/CellRendererManager';

const props = defineProps({
  column: {
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
const elementComponent = computed(() => {
  return typeof renderer.value == 'function' ? 'raw' : renderer.value;
});
const renderer = computed(() => {
  return getRenderer(props.type.children.type, props.type.children.enum);
});
const subValues = computed(() => {
  return props.value
    ? typeof renderer.value == 'function'
      ? props.value.map((subValue) => renderer.value(subValue))
      : props.value
    : [];
});
</script>

<template>
  <span v-for="(subValue, index) in subValues" :key="index">
    <template v-if="index">, </template>
    <template v-if="elementComponent == 'raw'">{{ subValue }}</template>
    <component
      :is="elementComponent"
      :column="column"
      :type="type.children"
      :value="subValue"
      :row-value="rowValue"
      :request-timezone="requestTimezone"
      :user-timezone="userTimezone"
    />
  </span>
</template>
