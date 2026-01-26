<script setup lang="ts">
import { classes } from '@core/ClassManager';
import { usePropertyPath } from '@components/Filter/Composable/PropertyPath';
import Icon from '@components/Common/Icon.vue';
import { translate } from '@i18n/i18n';
import { computed } from 'vue';

interface Props {
  entity: string;
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

const { label, sortable } = usePropertyPath(props);
const isColumnSortable = computed<boolean>(() => sortable.value || !!props.hasCustomOrder);
const orderLabel = computed<string>(() => props.order ? `(${translate(props.order)})` : '');
</script>

<template>
  <th scope="col" :aria-sort="isColumnSortable ? (props.order === 'asc' ? 'ascending' : props.order === 'desc' ? 'descending' : 'none') : undefined">
    <button
      v-if="isColumnSortable"
      type="button"
      :class="classes.btn"
      :active="props.order ? '' : undefined"
      :desc="props.order == 'desc' ? '' : undefined"
      :asc="props.order == 'asc' ? '' : undefined"
      @click="(e) => emit('click', columnId, e.ctrlKey)"
    >
      {{ label }}
      <Icon icon="down" :label="orderLabel" />
    </button>
    <div v-else>
      {{ label }}
    </div>
  </th>
</template>
