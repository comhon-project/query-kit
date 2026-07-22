<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { getTranslation, getCases, type EnumCase } from '@core/EnumSchema';
import { getLeafTypeContainer } from '@core/EntitySchema';
import { classes } from '@core/ClassManager';
import type { CustomInputProps } from '@core/types';

const modelValue = defineModel<string | string[] | undefined>();

const props = defineProps<CustomInputProps>();

const cases = ref<EnumCase[]>([]);

watchEffect(async () => {
  cases.value = await getCases(getLeafTypeContainer(props.target).enum!);
});

const options = computed<Record<string, string>>(() => {
  const result: Record<string, string> = {};
  for (const caseItem of cases.value) {
    result[caseItem.id] = getTranslation(caseItem);
  }
  return result;
});

const selectValue = computed({
  get: (): string | string[] | null => (props.multiple && modelValue.value == null ? [] : (modelValue.value ?? null)),
  set: (value: string | string[] | null) => {
    modelValue.value = value ?? undefined;
  },
});
</script>

<template>
  <select v-model="selectValue" :class="classes.input" :disabled="disabled" :multiple="multiple">
    <option v-for="(label, value) in options" :key="value" :value="value">
      {{ label }}
    </option>
  </select>
</template>
