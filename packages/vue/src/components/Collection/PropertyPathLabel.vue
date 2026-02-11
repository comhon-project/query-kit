<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { getPropertyPath, getPropertyTranslation } from '@core/EntitySchema';
import { locale } from '@i18n/i18n';
import InvalidColumn from '@components/Messages/InvalidColumn.vue';
import type { EntitySchema } from '@core/EntitySchema';

interface Props {
  entitySchema: EntitySchema;
  propertyId: string;
  customLabel?: string;
}

const props = defineProps<Props>();

const label = ref<string | false>();
watchEffect(async () => {
  // Read locale before the await so watchEffect tracks it.
  // getPropertyTranslation reads it too late (after the await) to be tracked.
  locale.value;
  try {
    const path = await getPropertyPath(props.entitySchema.id, props.propertyId);
    label.value = path.map((property) => getPropertyTranslation(property)).join(' ');
  } catch {
    label.value = false;
  }
});
</script>

<template>
  <InvalidColumn v-if="label === false" :column="propertyId" />
  <span v-else-if="customLabel">{{ customLabel }}</span>
  <span v-else-if="label">{{ label }}</span>
</template>
