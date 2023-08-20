<script setup>
import { computed } from 'vue';
import { classes } from '../../core/ClassManager';
import { config } from '../../config/config';
import { locale, translate } from '../../i18n/i18n';
import Enum from '../Common/Renderers/Enum.vue';
import Html from '../Common/Renderers/Html.vue';
import Boolean from '../Common/Renderers/Boolean.vue';
import Date from '../Common/Renderers/Date.vue';
import DateTime from '../Common/Renderers/DateTime.vue';
import Time from '../Common/Renderers/Time.vue';
import ForeignModel from '../Common/Renderers/ForeignModel.vue';

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
  if (props.column.property.enum) {
    return Enum;
  }
  switch (props.column.property.type) {
    case 'string':
      return 'raw';
    case 'integer':
      return 'raw';
    case 'float':
      return 'raw';
    case 'html':
      return Html;
    case 'boolean':
      return Boolean;
    case 'date':
      return Date;
    case 'datetime':
      return DateTime;
    case 'time':
      return Time;
    case 'relationship':
      return ForeignModel;
    default:
      return 'raw';
  }
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
