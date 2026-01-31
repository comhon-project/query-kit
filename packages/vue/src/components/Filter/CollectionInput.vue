<script setup lang="ts">
import { ref, watch } from 'vue';
import { classes } from '@core/ClassManager';
import IconButton from '@components/Common/IconButton.vue';
import UniqueInput from '@components/Filter/UniqueInput.vue';
import type { Property, RawScopeParameter } from '@core/EntitySchema';

interface Props {
  modelValue?: unknown[];
  target: Property | RawScopeParameter;
  editable?: boolean;
  entity: string;
  userTimezone?: string;
  requestTimezone?: string;
}

interface Emits {
  'update:modelValue': [value: unknown[]];
}

const emit = defineEmits<Emits>();

const props = withDefaults(defineProps<Props>(), {
  editable: true,
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
});

const arrayValues = ref<unknown[]>(props.modelValue ? [...props.modelValue] : [undefined]);

function addValue(): void {
  arrayValues.value.push(undefined);
  emit('update:modelValue', arrayValues.value);
}

function removeValue(index: number): void {
  arrayValues.value.splice(index, 1);
  emit('update:modelValue', arrayValues.value);
}

function updateValue(value: unknown, index: number): void {
  arrayValues.value[index] = value;
  emit('update:modelValue', arrayValues.value);
}

watch(
  () => props.modelValue,
  () => {
    arrayValues.value = props.modelValue ? [...props.modelValue] : [undefined];
  }
);
</script>

<template>
  <div :class="classes.in_container">
    <ul :class="classes.in_list">
      <li v-for="(value, index) in arrayValues" :key="index" :class="classes.in_value_container">
        <UniqueInput
          v-bind="props"
          :model-value="value"
          :editable="editable"
          :multiple="false"
          @update:model-value="(newValue: unknown) => updateValue(newValue, index)"
        />
        <IconButton v-if="editable" icon="delete" btn-class="btn_secondary" @click="() => removeValue(index)" />
      </li>
    </ul>
    <IconButton v-if="editable" icon="add_value" @click="addValue" />
  </div>
</template>
