<script setup>
import { computed } from 'vue';
import { classes } from '../../core/ClassManager';
import { getRenderer } from '../../core/CellRendererManager';
import Utils from '../../core/Utils';

const props = defineProps({
  column: {
    type: Object,
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
  flattened: {
    type: Boolean,
  },
});
const cellComponent = computed(() => {
  return typeof renderer.value == 'function' ? null : renderer.value;
});

const renderer = computed(() => {
  return props.column.renderer
    ? props.column.renderer
    : props.column.property
    ? getRenderer(props.column.property.type, props.column.property.enum)
    : null;
});

const value = computed(() => {
  let cellValue = props.column.property
    ? props.flattened
      ? props.rowValue[props.column.id]
      : Utils.getNestedValue(props.rowValue, props.column.id)
    : undefined;

  if (typeof renderer.value == 'function') {
    cellValue = renderer.value(cellValue, props.rowValue, props.column.id);
  }
  return cellValue;
});
</script>

<template>
  <td>
    <button
      v-if="column.onCellClick"
      type="button"
      :class="classes.collection_clickable_cell"
      @click="(e) => (column.onCellClick ? column.onCellClick(value, rowValue, column.id, e) : null)"
    >
      <template v-if="cellComponent == null">{{ value }}</template>
      <component
        :is="cellComponent"
        :column="column"
        :type="column.property"
        :value="value"
        :row-value="rowValue"
        :request-timezone="requestTimezone"
        :user-timezone="userTimezone"
      />
    </button>
    <div v-else :class="classes.collection_cell">
      <template v-if="cellComponent == null">{{ value }}</template>
      <component
        :is="cellComponent"
        :column="column"
        :type="column.property"
        :value="value"
        :row-value="rowValue"
        :request-timezone="requestTimezone"
        :user-timezone="userTimezone"
      />
    </div>
  </td>
</template>
