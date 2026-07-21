<script setup lang="ts">
import { classes } from '@core/ClassManager';
import { isPropertySortable } from '@core/EntitySchema';
import Icon from '@components/Common/Icon.vue';
import { translate } from '@i18n/i18n';
import { computed, ref, watchEffect } from 'vue';
import type { EntitySchema } from '@core/EntitySchema';

interface Props {
  entitySchema: EntitySchema;
  fieldId: string;
  label?: string;
  open?: boolean;
  order?: 'asc' | 'desc';
  hasCustomSort?: boolean;
  reflow?: boolean;
  sortableHeaders?: boolean;
}

interface Emits {
  click: [fieldId: string, ctrlKey: boolean];
}

const emit = defineEmits<Emits>();
const props = withDefaults(defineProps<Props>(), { sortableHeaders: true });

const sortable = ref(false);
const propertyPath = computed<string | undefined>(() => (props.open ? undefined : props.fieldId));
const isFieldSortable = computed<boolean>(
  () => props.sortableHeaders && (sortable.value || !!props.hasCustomSort),
);
const orderLabel = computed<string>(() => `(${translate(props.order ?? 'unsorted')})`);
const sortLabel = computed<string>(() => [props.label, orderLabel.value].filter(Boolean).join(' '));
const ariaSort = computed(() =>
  isFieldSortable.value
    ? props.order === 'asc'
      ? 'ascending'
      : props.order === 'desc'
        ? 'descending'
        : 'none'
    : undefined,
);

watchEffect(async () => {
  sortable.value = propertyPath.value ? await isPropertySortable(props.entitySchema.id, propertyPath.value) : false;
});
</script>

<template>
  <th scope="col" :role="reflow ? 'columnheader' : undefined" :aria-sort="ariaSort">
    <div :class="classes.collection_column_header">
      <span>{{ label }}</span>
      <button
        v-if="isFieldSortable"
        type="button"
        :class="classes.btn"
        :active="props.order ? '' : undefined"
        :desc="props.order == 'desc' ? '' : undefined"
        :asc="props.order == 'asc' ? '' : undefined"
        :aria-label="sortLabel"
        @click="(e) => emit('click', fieldId, e.ctrlKey)"
      >
        <Icon icon="sort_direction" :label="orderLabel" />
      </button>
    </div>
  </th>
</template>
