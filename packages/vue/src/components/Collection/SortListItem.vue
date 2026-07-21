<script setup lang="ts">
import { computed } from 'vue';
import { classes } from '@core/ClassManager';
import { translate, locale } from '@i18n/i18n';
import IconButton from '@components/Common/IconButton.vue';
import FieldLabel from '@components/Collection/FieldLabel.vue';
import PropertyPathEditor from '@components/Collection/PropertyPathEditor.vue';
import { getUniqueId } from '@core/Utils';
import type { EntitySchema } from '@core/EntitySchema';

interface Props {
  entitySchema: EntitySchema;
  open?: boolean;
  fixedPath?: boolean;
  label?: string | ((locale: string) => string);
}

interface Emits {
  remove: [];
  'grip-start': [event: Event];
}

const field = defineModel<string>('field', { required: true });
const order = defineModel<'asc' | 'desc'>('order', { required: true });
const emit = defineEmits<Emits>();
const props = defineProps<Props>();

const labelId = 'qkit-sort-item-label-' + getUniqueId();

const openLabel = computed<string>(() => {
  if (!props.label) return field.value;
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
  <span v-if="open" :id="labelId">{{ openLabel }}</span>
  <FieldLabel v-else-if="fixedPath" :id="labelId" :entity-schema="entitySchema" :field-id="field" :label="label" />
  <PropertyPathEditor
    v-else
    v-model="field"
    sortable-only
    :label-id="labelId"
    :entity-schema="entitySchema"
    :label="label"
  />
  <select v-model="order" :class="classes.collection_sort_order" :aria-labelledby="labelId">
    <option value="asc">{{ translate('asc') }}</option>
    <option value="desc">{{ translate('desc') }}</option>
  </select>
  <IconButton icon="delete" @click="emit('remove')" />
</template>
