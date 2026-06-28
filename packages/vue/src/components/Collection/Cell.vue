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
  rowValue: Record<string, unknown>;
  requestTimezone: string;
  userTimezone: string;
  property?: Property;
  renderer?: Component | RenderFunction | string;
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
    ? {
        click: (e: MouseEvent) => props.onClick!(value.value, props.rowValue, props.fieldId, e),
        keydown: (e: KeyboardEvent) => {
          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            props.onClick!(value.value, props.rowValue, props.fieldId, e as unknown as MouseEvent);
          }
        },
      }
    : {},
);
</script>

<template>
  <td
    :class="onClick ? classes.collection_clickable_cell : classes.collection_cell"
    :tabindex="onClick ? 0 : undefined"
    :role="onClick ? 'button' : undefined"
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
  </td>
</template>
