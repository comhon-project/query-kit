<script setup>
import { computed } from 'vue';
import { classes } from '../../core/ClassManager';
import { usePropertyPath } from '../Filter/Composable/PropertyPath';

defineEmits(['click']);
const props = defineProps({
  model: {
    type: String,
    required: true,
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

const buttonClass = computed(() => {
  return (
    classes.btn +
    ' ' +
    (props.active ? classes.active + ' ' + (props.order == 'asc' ? classes.order_asc : classes.order_desc) : '')
  );
});
</script>

<template>
  <th>
    <button v-if="sortable" type="button" :class="buttonClass" @click="$emit('click', propertyId)">
      {{ label }}
    </button>
    <div v-else>
      {{ label }}
    </div>
  </th>
</template>
