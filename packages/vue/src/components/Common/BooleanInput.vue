<script setup>
import { ref } from 'vue';
import { classes } from '../../core/ClassManager';
import Utils from '../../core/Utils';
import { translate } from '../../i18n/i18n';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
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
});
const uniqueId = Utils.getUniqueId();

function update(value) {
  emit('update:modelValue', value);
}
</script>

<template>
  <div :class="classes.condition_input_boolean">
    <input
      type="radio"
      :name="`boolean-input-filter-${uniqueId}`"
      :checked="modelValue === true"
      @input="() => update(true)"
    />
    <span>{{ translate('yes') }}</span>
    <input
      type="radio"
      :name="`boolean-input-filter-${uniqueId}`"
      :checked="modelValue === false"
      @input="() => update(false)"
    />
    <span>{{ translate('no') }}</span>
  </div>
</template>
