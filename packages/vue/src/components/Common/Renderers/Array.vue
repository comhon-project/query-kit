<script setup>
import { computed } from 'vue';
import { getComponent } from '../../../core/CellRendererManager';

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
const computedComponent = computed(() => {
  if (props.column.component) {
    return props.column.component;
  }
  return getComponent(props.type.children.type, props.type.children.enum);
});
</script>

<template>
  <template v-if="value">
    <span v-for="(subValue, index) in value">
      <template v-if="index">, </template>
      <template v-if="computedComponent == 'raw'">{{ subValue }}</template>
      <component
        :is="computedComponent"
        :column="column"
        :type="type.children"
        :value="subValue"
        :row-value="rowValue"
        :request-timezone="requestTimezone"
        :user-timezone="userTimezone"
      />
    </span>
  </template>
</template>
