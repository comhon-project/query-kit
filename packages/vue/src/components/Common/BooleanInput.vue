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
