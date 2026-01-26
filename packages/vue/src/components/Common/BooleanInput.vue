<script setup lang="ts">
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';

interface Props {
  disabled: boolean;
}

const modelValue = defineModel<boolean>();

defineProps<Props>();
</script>

<template>
  <fieldset :class="classes.input_boolean">
    <legend class="qkit-sr-only">{{ translate('boolean_choice') }}</legend>
    <label>
      <input
        type="radio"
        :checked="modelValue === true"
        :disabled="disabled"
        @input="modelValue = true"
      />
      {{ translate('yes') }}
    </label>
    <label>
      <input
        type="radio"
        :checked="modelValue === false"
        :disabled="disabled"
        @input="modelValue = false"
      />
      {{ translate('no') }}
    </label>
  </fieldset>
</template>
