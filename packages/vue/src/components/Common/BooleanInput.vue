<script setup>
import { classes } from '@core/ClassManager';
import Utils from '@core/Utils';
import { translate } from '@i18n/i18n';

const emit = defineEmits(['update:modelValue']);
defineProps({
  modelValue: {
    type: Boolean,
  },
  target: {
    type: Object,
    required: true,
  },
  model: {
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

function update(value) {
  emit('update:modelValue', value);
}
</script>

<template>
  <div :class="classes.input_boolean">
    <input
      type="radio"
      :name="`boolean-input-filter-${uniqueId}`"
      :checked="modelValue === true"
      :disabled="disabled"
      @input="() => update(true)"
    />
    <span>{{ translate('yes') }}</span>
    <input
      type="radio"
      :name="`boolean-input-filter-${uniqueId}`"
      :checked="modelValue === false"
      :disabled="disabled"
      @input="() => update(false)"
    />
    <span>{{ translate('no') }}</span>
  </div>
</template>
