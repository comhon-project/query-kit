<script setup lang="ts">
import { classes } from '@core/ClassManager';
import { isPropertySortable } from '@core/EntitySchema';
import ColumnName from '@components/Collection/ColumnName.vue';
import Icon from '@components/Common/Icon.vue';
import { translate } from '@i18n/i18n';
import { computed, ref, watchEffect } from 'vue';
import type { EntitySchema } from '@core/EntitySchema';

interface Props {
  entitySchema: EntitySchema;
  columnId?: string;
  propertyId?: string;
  label?: string | ((locale: string) => string);
  order?: 'asc' | 'desc';
  hasCustomOrder?: boolean;
}

interface Emits {
  click: [columnId: string | undefined, ctrlKey: boolean];
}

const emit = defineEmits<Emits>();
const props = defineProps<Props>();

const sortable = ref(false);
const isColumnSortable = computed<boolean>(() => sortable.value || !!props.hasCustomOrder);
const orderLabel = computed<string>(() => `(${translate(props.order ?? 'unsorted')})`);
const ariaSort = computed(() =>
  isColumnSortable.value
    ? props.order === 'asc'
      ? 'ascending'
      : props.order === 'desc'
        ? 'descending'
        : 'none'
    : undefined,
);

watchEffect(async () => {
  sortable.value = props.propertyId ? await isPropertySortable(props.entitySchema.id, props.propertyId) : false;
});
</script>

<template>
  <th scope="col" :aria-sort="ariaSort">
    <button
      v-if="isColumnSortable"
      type="button"
      :class="classes.btn"
      :active="props.order ? '' : undefined"
      :desc="props.order == 'desc' ? '' : undefined"
      :asc="props.order == 'asc' ? '' : undefined"
      @click="(e) => emit('click', columnId, e.ctrlKey)"
    >
      <ColumnName :entity-schema="entitySchema" :property-id="propertyId" :label="label" />
      <Icon icon="sort" :label="orderLabel" />
    </button>
    <div v-else>
      <ColumnName :entity-schema="entitySchema" :property-id="propertyId" :label="label" />
    </div>
  </th>
</template>
