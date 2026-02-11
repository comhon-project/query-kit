<script setup lang="ts">
import { computed } from 'vue';
import { classes } from '@core/ClassManager';
import { locale } from '@i18n/i18n';
import IconButton from '@components/Common/IconButton.vue';
import ColumnPropertyChoice from '@components/Collection/ColumnPropertyChoice.vue';
import type { EntitySchema } from '@core/EntitySchema';

interface Props {
  entitySchema: EntitySchema;
  columns: string[];
  open?: boolean;
  label?: string | ((locale: string) => string);
}

interface Emits {
  remove: [];
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
  <div :class="classes.column_choice">
    <span v-if="open">{{ openLabel }}</span>
    <ColumnPropertyChoice
      v-else
      v-model:property-id="columnId"
      :entity-schema="entitySchema"
      :columns="columns"
      :label="label"
    />
    <IconButton icon="delete" @click="emit('remove')" />
  </div>
</template>
