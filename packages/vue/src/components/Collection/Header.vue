<script setup>
import { computed } from 'vue';
import { classes } from '../../core/ClassManager';
import { locale } from '../../i18n/i18n';

const emit = defineEmits(['click']);
const props = defineProps({
  column: {
    type: Object,
    required: true,
  },
  active: {
    type: Boolean,
  },
  order: {
    type: String,
  },
});

const label = computed(() => {
  const currentLocale = locale.value;
  return typeof props.column.label == 'object'
    ? props.column.label.value
    : typeof props.column.label == 'function'
    ? props.column.label(currentLocale)
    : props.column.label;
});
</script>

<template>
  <th>
    <button
      v-if="column.sortable"
      type="button"
      :class="
        classes.btn +
        ' ' +
        (active ? classes.active + ' ' + (order == 'asc' ? classes.order_asc : classes.order_desc) : '')
      "
      @click="$emit('click', column.id)"
    >
      {{ label }}
    </button>
    <div v-else>
      {{ label }}
    </div>
  </th>
</template>
