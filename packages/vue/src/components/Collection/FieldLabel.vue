<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { locale } from '@i18n/i18n';
import { resolveFieldLabel } from '@components/Composable/ColumnLabels';
import InvalidField from '@components/Messages/InvalidField.vue';
import type { EntitySchema } from '@core/EntitySchema';

interface Props {
  entitySchema: EntitySchema;
  fieldId: string;
  open?: boolean;
  label?: string | ((locale: string) => string);
}

const props = defineProps<Props>();

const resolved = ref<string | false>();
watchEffect(async (onCleanup) => {
  let stale = false;
  onCleanup(() => (stale = true));
  const label = await resolveFieldLabel(
    props.entitySchema.id,
    props.fieldId,
    { open: props.open, label: props.label },
    locale.value,
  );
  if (!stale) resolved.value = label;
});
</script>

<template>
  <InvalidField v-if="resolved === false" :field="fieldId" />
  <span v-else-if="resolved">{{ resolved }}</span>
</template>
