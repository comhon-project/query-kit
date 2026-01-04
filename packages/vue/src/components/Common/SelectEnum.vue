<script setup>
import { ref, computed, watchEffect } from 'vue';
import { getTranslation, getCases } from '@core/EnumSchema';
import { classes } from '@core/ClassManager';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: undefined,
    default: undefined,
  },
  enumId: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const cases = ref([]);

watchEffect(async () => {
  cases.value = await getCases(props.enumId);
});

const options = computed(() => {
  const result = {};
  for (const caseItem of cases.value) {
    result[caseItem.id] = getTranslation(caseItem);
  }
  return result;
});

function onInput(event) {
  emit('update:modelValue', event.target.value);
}
</script>

<template>
  <select :class="classes.input" :disabled="disabled" :value="modelValue" @input="onInput">
    <option v-for="(label, value) in options" :key="value" :value="value">
      {{ label }}
    </option>
  </select>
</template>
