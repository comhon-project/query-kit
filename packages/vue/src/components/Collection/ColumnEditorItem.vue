<script setup lang="ts">
import { computed } from 'vue';
import { locale } from '@i18n/i18n';
import IconButton from '@components/Common/IconButton.vue';
import PropertyPathEditor from '@components/Collection/PropertyPathEditor.vue';
import type { EntitySchema } from '@core/EntitySchema';

interface Props {
  entitySchema: EntitySchema;
  columns: string[];
  open?: boolean;
  label?: string | ((locale: string) => string);
}

interface Emits {
  remove: [];
  'grip-start': [event: Event];
}

const emit = defineEmits<Emits>();
const columnId = defineModel<string>({ required: true });
const props = defineProps<Props>();

const openLabel = computed<string>(() => {
  if (!props.label) return columnId.value;
  return typeof props.label === 'function' ? props.label(locale.value) : props.label;
});
</script>

<template>
  <IconButton
    icon="grip"
    label="reorder"
    @mousedown="emit('grip-start', $event)"
    @keydown="emit('grip-start', $event)"
  />
  <span v-if="open">{{ openLabel }}</span>
  <PropertyPathEditor
    v-else
    v-model="columnId"
    :entity-schema="entitySchema"
    :columns="columns"
    :label="label"
  />
  <IconButton icon="delete" @click="emit('remove')" />
</template>
