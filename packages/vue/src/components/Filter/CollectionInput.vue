<script setup lang="ts">
import { watchEffect } from 'vue';
import { classes } from '@core/ClassManager';
import IconButton from '@components/Common/IconButton.vue';
import UniqueInput from '@components/Filter/UniqueInput.vue';
import type { Property, RawScopeParameter } from '@core/EntitySchema';

interface Props {
  target: Property | RawScopeParameter;
  editable?: boolean;
  entity: string;
  userTimezone?: string;
  requestTimezone?: string;
}

const modelValue = defineModel<unknown[]>({ default: [] });

const props = withDefaults(defineProps<Props>(), {
  editable: true,
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
});

watchEffect(() => {
  if (!modelValue.value?.length) {
    modelValue.value = [undefined];
  }
});

function addValue(): void {
  modelValue.value.push(undefined);
}

function removeValue(index: number): void {
  modelValue.value.splice(index, 1);
}
</script>

<template>
  <div :class="classes.in_container">
    <ul :class="classes.in_list">
      <li v-for="(_, index) in modelValue" :key="index" :class="classes.in_value_container">
        <UniqueInput
          v-bind="props"
          v-model="modelValue[index]"
          :editable="editable"
          :multiple="false"
        />
        <IconButton v-if="editable" icon="delete" btn-class="btn_secondary" @click="() => removeValue(index)" />
      </li>
    </ul>
    <IconButton v-if="editable" icon="add_value" @click="addValue" />
  </div>
</template>
