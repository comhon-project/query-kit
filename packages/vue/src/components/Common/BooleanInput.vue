<script setup lang="ts">
import { classes } from '@core/ClassManager';
import { getUniqueId } from '@core/Utils';
import { translate } from '@i18n/i18n';

interface Props {
  disabled: boolean;
}

const modelValue = defineModel<boolean>();

defineProps<Props>();

const uniqueId = getUniqueId();
</script>

<template>
  <fieldset :class="classes.input_boolean">
    <legend class="qkit-sr-only">{{ translate('boolean_choice') }}</legend>
    <input
      :id="`boolean-true-${uniqueId}`"
      type="radio"
      :name="`boolean-input-filter-${uniqueId}`"
      :checked="modelValue === true"
      :disabled="disabled"
      @input="modelValue = true"
    />
    <label :for="`boolean-true-${uniqueId}`">{{ translate('yes') }}</label>
    <input
      :id="`boolean-false-${uniqueId}`"
      type="radio"
      :name="`boolean-input-filter-${uniqueId}`"
      :checked="modelValue === false"
      :disabled="disabled"
      @input="modelValue = false"
    />
    <label :for="`boolean-false-${uniqueId}`">{{ translate('no') }}</label>
  </fieldset>
</template>
