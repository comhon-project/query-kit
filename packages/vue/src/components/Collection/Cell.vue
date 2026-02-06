<script setup lang="ts">
import { computed, type Component } from 'vue';
import { classes } from '@core/ClassManager';
import { getPropertyRenderer } from '@core/CellRendererManager';
import { getNestedValue } from '@core/Utils';
import { locale } from '@i18n/i18n';
import type { Property } from '@core/EntitySchema';
import type { RenderFunction } from '@core/types';

interface Props {
  columnId: string;
  rowValue: Record<string, unknown>;
  requestTimezone: string;
  userTimezone: string;
  property?: Property;
  flattened?: boolean;
  renderer?: Component | RenderFunction | string;
  onClick?: (value: unknown, rowValue: Record<string, unknown>, columnId: string, event: MouseEvent) => void;
}

interface Emits {
  click: [value: unknown, rowValue: Record<string, unknown>, columnId: string, event: MouseEvent];
}

const emit = defineEmits<Emits>();
const props = defineProps<Props>();

const renderer = computed<Component | RenderFunction | string | null>(() => {
  return props.renderer || (props.property ? getPropertyRenderer(props.property) : null);
});

const cellComponent = computed<Component | string | null>(() => {
  return typeof renderer.value == 'function' ? null : renderer.value;
});

const value = computed<unknown>(() => {
  let cellValue: unknown = props.property
    ? props.flattened
      ? props.rowValue[props.columnId]
      : getNestedValue(props.rowValue, props.columnId)
    : undefined;

  if (typeof renderer.value == 'function') {
    cellValue = (renderer.value as RenderFunction)(cellValue, props.rowValue, props.columnId, locale.value);
  }
  return cellValue;
});
</script>

<template>
  <td>
    <component
      :is="onClick ? 'button' : 'div'"
      :type="onClick ? 'button' : undefined"
      :class="onClick ? classes.collection_clickable_cell : classes.collection_cell"
      v-on="onClick ? { click: (e: MouseEvent) => emit('click', value, rowValue, columnId, e) } : {}"
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
    </component>
  </td>
</template>
