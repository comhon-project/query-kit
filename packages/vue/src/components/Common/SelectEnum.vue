<script setup>
import { ref, computed, watchEffect } from 'vue';
import { getTranslation, getCases } from '@core/EnumSchema';
import { classes } from '@core/ClassManager';

const model = defineModel();
const props = defineProps({
  enumId: {
    type: String,
    required: true,
  },
  operator: {
    type: String,
    default: undefined,
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

const isMultiple = computed(() => {
  return props.operator === 'in' || props.operator === 'not_in';
});

const selectValue = computed({
  get: () => (isMultiple.value && model.value == null ? [] : model.value),
  set: (value) => {
    model.value = value;
  },
});
</script>

<template>
  <select v-model="selectValue" :class="classes.input" :disabled="disabled" :multiple="isMultiple">
    <option v-for="(label, value) in options" :key="value" :value="value">
      {{ label }}
    </option>
  </select>
</template>
