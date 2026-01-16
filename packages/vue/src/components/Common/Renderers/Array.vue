<script setup lang="ts">
import { computed, type Component } from 'vue';
import { getTypeRenderer } from '@core/CellRendererManager';
import { locale } from '@i18n/i18n';
import type { CellRendererProps, RenderFunction } from '@core/types';

const props = defineProps<CellRendererProps>();

const elementComponent = computed<Component | null>(() => {
  return typeof renderer.value == 'function' ? null : (renderer.value as Component);
});

const renderer = computed<Component | RenderFunction | null>(() => {
  return getTypeRenderer(props.type.children!);
});

const subValues = computed<unknown[]>(() => {
  const valueArray = props.value as unknown[] | null;
  return valueArray
    ? typeof renderer.value == 'function'
      ? valueArray.map((subValue) => (renderer.value as RenderFunction)(subValue, {}, '', locale.value))
      : valueArray
    : [];
});
</script>

<template>
  <span v-for="(subValue, index) in subValues" :key="index">
    <template v-if="index">, </template>
    <template v-if="elementComponent == null">{{ subValue }}</template>
    <component
      :is="elementComponent"
      :column-id="columnId"
      :property="property"
      :type="type.children"
      :value="subValue"
      :row-value="rowValue"
      :request-timezone="requestTimezone"
      :user-timezone="userTimezone"
    />
  </span>
</template>
