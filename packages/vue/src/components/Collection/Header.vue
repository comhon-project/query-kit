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
}

interface Emits {
  click: [fieldId: string, ctrlKey: boolean];
}

const emit = defineEmits<Emits>();
const props = defineProps<Props>();

const sortable = ref(false);
const propertyPath = computed<string | undefined>(() => (props.open ? undefined : props.fieldId));
const isFieldSortable = computed<boolean>(() => sortable.value || !!props.hasCustomSort);
const orderLabel = computed<string>(() => `(${translate(props.order ?? 'unsorted')})`);
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
    <button
      v-if="isFieldSortable"
      type="button"
      :class="classes.btn"
      :active="props.order ? '' : undefined"
      :desc="props.order == 'desc' ? '' : undefined"
      :asc="props.order == 'asc' ? '' : undefined"
      @click="(e) => emit('click', fieldId, e.ctrlKey)"
    >
      <span>{{ label }}</span>
      <Icon icon="sort" :label="orderLabel" />
      <span :class="classes.sr_only">{{ orderLabel }}</span>
    </button>
    <div v-else>{{ label }}</div>
  </th>
</template>
