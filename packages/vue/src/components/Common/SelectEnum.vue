<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { getTranslation, getCases, type EnumCase } from '@core/EnumSchema';
import { classes } from '@core/ClassManager';

interface Props {
  enumId: string;
  multiple: boolean;
  disabled: boolean;
}

const model = defineModel<string | string[] | null>();

const props = defineProps<Props>();

const cases = ref<EnumCase[]>([]);

watchEffect(async () => {
  cases.value = await getCases(props.enumId);
});

const options = computed<Record<string, string>>(() => {
  const result: Record<string, string> = {};
  for (const caseItem of cases.value) {
    result[caseItem.id] = getTranslation(caseItem);
  }
  return result;
});

const selectValue = computed({
  get: (): string | string[] | null => (props.multiple && model.value == null ? [] : (model.value ?? null)),
  set: (value: string | string[] | null) => {
    model.value = value;
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
