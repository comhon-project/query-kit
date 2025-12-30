<script setup>
import { computed } from 'vue';
import { classes } from '@core/ClassManager';
import { getPropertyRenderer } from '@core/CellRendererManager';
import Utils from '@core/Utils';
import { locale } from '@i18n/i18n';

const emit = defineEmits(['click']);
const props = defineProps({
  columnId: {
    type: String,
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
  property: {
    type: Object,
    default: undefined,
  },
  flattened: {
    type: Boolean,
  },
  renderer: {
    type: [Object, Function, String],
    default: undefined,
  },
  onClick: {
    type: Function,
    default: undefined,
  },
});
const cellComponent = computed(() => {
  return typeof renderer.value == 'function' ? null : renderer.value;
});

const renderer = computed(() => {
  return props.renderer || (props.property ? getPropertyRenderer(props.property) : null);
});

const value = computed(() => {
  let cellValue = props.property
    ? props.flattened
      ? props.rowValue[props.columnId]
      : Utils.getNestedValue(props.rowValue, props.columnId)
    : undefined;

  if (typeof renderer.value == 'function') {
    cellValue = renderer.value(cellValue, props.rowValue, props.columnId, locale.value);
  }
  return cellValue;
});
</script>

<template>
  <td>
    <button
      v-if="onClick"
      type="button"
      :class="classes.collection_clickable_cell"
      @click="(e) => emit('click', value, rowValue, columnId, e)"
    >
      <template v-if="cellComponent == null">{{ value }}</template>
      <component
        :is="cellComponent"
        :column-id="columnId"
        :property="property"
        :type="property"
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
        :column-id="columnId"
        :property="property"
        :type="property"
        :value="value"
        :row-value="rowValue"
        :request-timezone="requestTimezone"
        :user-timezone="userTimezone"
      />
    </div>
  </td>
</template>
