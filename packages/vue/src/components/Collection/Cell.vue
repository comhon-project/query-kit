<script setup lang="ts">
import { computed, type Component } from 'vue';
import { classes } from '@core/ClassManager';
import { getPropertyRenderer } from '@core/FieldRendererManager';
import { getNestedValue } from '@core/Utils';
import { locale } from '@i18n/i18n';
import type { Property } from '@core/EntitySchema';
import type { RenderFunction } from '@core/types';

interface Props {
  fieldId: string;
  columnLabel?: string;
  rowValue: Record<string, unknown>;
  requestTimezone: string;
  userTimezone: string;
  property?: Property;
  renderer?: Component | RenderFunction | string;
  reflow?: boolean;
  onClick?: (value: unknown, item: Record<string, unknown>, fieldId: string, event: MouseEvent) => void;
}

const props = defineProps<Props>();

const renderer = computed<Component | RenderFunction | string | null>(() => {
  return props.renderer || (props.property ? getPropertyRenderer(props.property) : null);
});

const cellComponent = computed<Component | string | null>(() => {
  return typeof renderer.value == 'function' ? null : renderer.value;
});

const value = computed<unknown>(() => {
  let cellValue: unknown = props.property
    ? getNestedValue(props.rowValue, props.fieldId)
    : undefined;

  if (typeof renderer.value == 'function') {
    cellValue = (renderer.value as RenderFunction)(cellValue, props.rowValue, props.fieldId, locale.value);
  }
  return cellValue;
});

const cellEvents = computed(() =>
  props.onClick
    ? { click: (e: MouseEvent) => props.onClick!(value.value, props.rowValue, props.fieldId, e) }
    : {},
);
</script>

<template>
  <td :class="classes.collection_cell" :role="reflow ? 'cell' : undefined">
    <span v-if="reflow" :class="classes.collection_cell_label" aria-hidden="true">{{ columnLabel }}</span>
    <component
      :is="onClick ? 'button' : 'div'"
      :type="onClick ? 'button' : undefined"
      :class="onClick ? classes.collection_clickable_cell : classes.collection_cell_value"
      v-on="cellEvents"
    >
      <template v-if="cellComponent == null">{{ value }}</template>
      <component
        :is="cellComponent"
        :field-id="fieldId"
        :property="property"
        :type="property"
        :value="value"
        :item="rowValue"
        :request-timezone="requestTimezone"
        :user-timezone="userTimezone"
      />
    </component>
  </td>
</template>
