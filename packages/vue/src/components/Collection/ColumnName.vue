<script setup lang="ts">
import { computed } from 'vue';
import { locale } from '@i18n/i18n';
import PropertyPathLabel from '@components/Collection/PropertyPathLabel.vue';
import type { EntitySchema } from '@core/EntitySchema';

interface Props {
  entitySchema: EntitySchema;
  columnId: string;
  open?: boolean;
  label?: string | ((locale: string) => string);
}

const props = defineProps<Props>();

const customLabel = computed<string | undefined>(() => {
  if (!props.label) return undefined;
  return typeof props.label === 'function' ? props.label(locale.value) : props.label;
});
</script>

<template>
  <PropertyPathLabel v-if="!open" :entity-schema="entitySchema" :property-path="columnId" :custom-label="customLabel" />
  <span v-else-if="customLabel">{{ customLabel }}</span>
</template>
