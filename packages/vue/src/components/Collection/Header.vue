<script setup>
import { classes } from '@core/ClassManager';
import { usePropertyPath } from '@components/Filter/Composable/PropertyPath';
import Icon from '@components/Common/Icon.vue';
import { computed } from 'vue';

const emit = defineEmits(['click']);
const props = defineProps({
  model: {
    type: String,
    required: true,
  },
  columnId: {
    type: String,
    default: undefined,
  },
  propertyId: {
    type: String,
    default: undefined,
  },
  label: {
    type: [String, Function],
    default: undefined,
  },
  order: {
    type: String,
    default: undefined,
  },
  hasCustomOrder: {
    type: Boolean,
  },
});

const { label, sortable } = usePropertyPath(props);
const isColumnSortable = computed(() => sortable.value || props.hasCustomOrder);
</script>

<template>
  <th>
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
      <Icon icon="down" />
    </button>
    <div v-else>
      {{ label }}
    </div>
  </th>
</template>
