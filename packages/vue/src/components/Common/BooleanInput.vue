<script setup>
import { classes } from '@core/ClassManager';
import Utils from '@core/Utils';
import { translate } from '@i18n/i18n';

const modelValue = defineModel({ type: Boolean });
defineProps({
  target: {
    type: Object,
    required: true,
  },
  entity: {
    type: String,
    required: true,
  },
  operator: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    required: true,
  },
});
const uniqueId = Utils.getUniqueId();
</script>

<template>
  <div :class="classes.input_boolean">
    <input
      type="radio"
      :name="`boolean-input-filter-${uniqueId}`"
      :checked="modelValue === true"
      :disabled="disabled"
      @input="modelValue = true"
    />
    <span>{{ translate('yes') }}</span>
    <input
      type="radio"
      :name="`boolean-input-filter-${uniqueId}`"
      :checked="modelValue === false"
      :disabled="disabled"
      @input="modelValue = false"
    />
    <span>{{ translate('no') }}</span>
  </div>
</template>
