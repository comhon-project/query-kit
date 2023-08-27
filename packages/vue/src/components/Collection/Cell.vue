<script setup>
import { computed } from 'vue';
import { classes } from '../../core/ClassManager';
import Utils from '../../core/Utils';
import { getComponent } from '../../core/CellRendererManager';

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
  if (props.column.cellComponent) {
    return props.column.cellComponent;
  }
  return getComponent(props.column.property.type, props.column.property.enum);
});

const value = computed(() => {
  return props.flattened ? props.rowValue[props.column.id] : Utils.getNestedValue(props.rowValue, props.column.id);
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
      <template v-if="cellComponent == 'raw'">{{ value }}</template>
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
      <template v-if="cellComponent == 'raw'">{{ value }}</template>
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
