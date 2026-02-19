<script setup lang="ts">
import { watchEffect } from 'vue';
import { classes } from '@core/ClassManager';
import IconButton from '@components/Common/IconButton.vue';
import UniqueInput from '@components/Filter/UniqueInput.vue';
import type { Property, RawScopeParameter, EntitySchema } from '@core/EntitySchema';

interface Props {
  target: Property | RawScopeParameter;
  editable?: boolean;
  entitySchema: EntitySchema;
}

const modelValue = defineModel<unknown[]>({ default: [] });

const props = withDefaults(defineProps<Props>(), {
  editable: true,
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
      <li v-for="(_, index) in modelValue" :key="index">
        <UniqueInput
          v-model="modelValue[index]"
          :target="target"
          :entity-schema="entitySchema"
          :editable="editable"
          :multiple="false"
        />
        <IconButton v-if="editable" icon="delete" btn-class="btn_danger" @click="() => removeValue(index)" />
      </li>
    </ul>
    <IconButton v-if="editable" icon="add_value" @click="addValue" />
  </div>
</template>
