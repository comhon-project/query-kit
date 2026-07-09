<script setup lang="ts">
import FieldsList from '@components/Collection/FieldsList.vue';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import { getUniqueId } from '@core/Utils';
import type { EntitySchema } from '@core/EntitySchema';
import type { History } from '@components/Composable/History';
import type { CustomFieldConfig } from '@core/types';

interface Props {
  entitySchema: EntitySchema;
  customFields?: Record<string, CustomFieldConfig>;
  history?: History;
}

const fields = defineModel<string[]>({ required: true });
defineProps<Props>();

const labelId = 'qkit-fields-builder-label-' + getUniqueId();
</script>

<template>
  <section :class="classes.fields_builder" :aria-labelledby="labelId">
    <div :class="classes.fields_builder_header">
      <span :id="labelId" :class="classes.builder_label">{{ translate('columns') }}</span>
      <div v-if="$slots.actions" :class="classes.fields_builder_actions"><slot name="actions" /></div>
    </div>
    <FieldsList v-model="fields" :history="history" :entity-schema="entitySchema" :custom-fields="customFields" />
  </section>
</template>
