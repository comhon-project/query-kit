<script setup>
import { classes } from '../../core/ClassManager';
import { usePropertyPath } from '../Filter/Composable/PropertyPath';
import Icon from '../Common/Icon.vue';

defineEmits(['click']);
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
  active: {
    type: Boolean,
  },
  order: {
    type: String,
    default: undefined,
  },
});

const { label, sortable } = usePropertyPath(props);
</script>

<template>
  <th>
    <button
      v-if="sortable"
      type="button"
      :class="classes.btn"
      :active="props.active ? '' : undefined"
      :desc="props.active && props.order == 'desc' ? '' : undefined"
      @click="$emit('click', columnId)"
    >
      {{ label }}
      <Icon icon="down" />
    </button>
    <div v-else>
      {{ label }}
    </div>
  </th>
</template>
