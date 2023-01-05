<script setup>
import { computed } from 'vue'
import { classes } from '../../core/ClassManager';
import { config } from '../../config/config';
import { locale, translate } from '../../i18n/i18n';
import { DateTime } from 'luxon';

const props = defineProps({
  column: {
    type: Object,
    required: true
  },
  rowValue: {
    type: Object,
    required: true
  },
  requestTimezone: {
    type: String,
    required: true
  },
  userTimezone: {
    type: String,
    required: true
  },
});
const computedValue = computed(() => {
  const propertyValue = props.rowValue[props.column.id];
  if (props.column.property.enum) {
    return props.column.property.enum[propertyValue] 
  }

  switch (props.column.property.type) {
    case 'string': 
      return propertyValue;
    case 'integer':
      return propertyValue;
    case 'float': 
      return propertyValue;
    case 'html': 
      return propertyValue;
    case 'boolean':
      return translate(propertyValue ? 'yes' : 'no');
    case 'date': 
      return (new Date(propertyValue)).toLocaleDateString(
        locale.value, 
        { year: 'numeric', month: 'numeric', day: 'numeric' }
      );
    case 'datetime':
      return DateTime.fromISO(propertyValue, { zone: props.requestTimezone, locale: locale.value }).setZone(props.userTimezone).toLocaleString(
        { year: 'numeric', month: 'numeric', day: 'numeric', hour: "2-digit", minute: "2-digit" }
      );
    case 'time': 
      return (new Date('1970-01-01 ' + propertyValue)).toLocaleTimeString(
        locale.value, 
        { hour: "2-digit", minute: "2-digit" }
      );
    default:
      return propertyValue;
  }
});
const useHtml = computed(() => {
  return config.renderHtml && props.column.property.type == 'html';
});
</script>

<template>
  <td>
    <div v-if="column.component">
      <component :is="column.component" :value="computedValue" :row-value="rowValue"/>
    </div>
    <button v-else-if="column.onCellClick"
      type="button"
      :class="classes.collection_clickable_cell"
      @click="(e) => column.onCellClick ? column.onCellClick(rowValue, column.id, e) : null"
    >
      <div v-if="useHtml" v-html="computedValue"></div>
      <template v-else>{{ computedValue }}</template>
    </button>
    <div v-else :class="classes.collection_cell">
      <div v-if="useHtml" v-html="computedValue"></div>
      <template v-else>{{ computedValue }}</template>
    </div>
  </td>
</template>
