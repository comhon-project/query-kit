<script setup lang="ts">
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import SortList from '@components/Collection/SortList.vue';
import { getUniqueId } from '@core/Utils';
import type { EntitySchema } from '@core/EntitySchema';
import type { History } from '@components/Composable/History';
import type { CustomFieldConfig, SortItemField } from '@core/types';

interface Props {
  entitySchema: EntitySchema;
  customFields?: Record<string, CustomFieldConfig>;
  history?: History;
}

const sort = defineModel<(string | SortItemField)[]>({ required: true });
defineProps<Props>();

const labelId = 'qkit-sort-builder-label-' + getUniqueId();
</script>

<template>
  <section :class="classes.sort_builder" :aria-labelledby="labelId">
    <div :class="classes.sort_builder_header">
      <span :id="labelId" :class="classes.builder_label">{{ translate('sort') }}</span>
      <div v-if="$slots.actions" :class="classes.sort_builder_actions"><slot name="actions" /></div>
    </div>
    <SortList v-model="sort" :history="history" :entity-schema="entitySchema" :custom-fields="customFields" />
  </section>
</template>
