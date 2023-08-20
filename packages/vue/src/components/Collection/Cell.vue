<script setup>
import { computed } from 'vue';
import { classes } from '../../core/ClassManager';
import { getComponent } from '../../core/CellRendererManager';

const props = defineProps({
  column: {
    type: Object,
    required: true,
  },
  rowValue: {
    type: Object,
    required: true,
  },
  requestTimezone: {
    type: String,
    required: true,
  },
  userTimezone: {
    type: String,
    required: true,
  },
});
const computedComponent = computed(() => {
  if (props.column.component) {
    return props.column.component;
  }
  return getComponent(props.column.property.type, props.column.property.enum);
});
</script>

<template>
  <td>
    <button
      v-if="column.onCellClick"
      type="button"
      :class="classes.collection_clickable_cell"
      @click="(e) => (column.onCellClick ? column.onCellClick(rowValue, column.id, e) : null)"
    >
      <template v-if="computedComponent == 'raw'">{{ rowValue[column.id] }}</template>
      <component
        :is="computedComponent"
        :column="column"
        :value="rowValue[column.id]"
        :row-value="rowValue"
        :request-timezone="requestTimezone"
        :user-timezone="userTimezone"
      />
    </button>
    <div v-else :class="classes.collection_cell">
      <template v-if="computedComponent == 'raw'">{{ rowValue[column.id] }}</template>
      <component
        :is="computedComponent"
        :column="column"
        :value="rowValue[column.id]"
        :row-value="rowValue"
        :request-timezone="requestTimezone"
        :user-timezone="userTimezone"
      />
    </div>
  </td>
</template>
