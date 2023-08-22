<script setup>
const props = defineProps({
  column: {
    type: Object,
    required: true,
  },
  type: {
    type: Object,
    required: true,
  },
  value: {
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

function cellAlert(e) {
  e.stopPropagation();
  alert(props.rowValue['company.brand_name']);
}
</script>

<template>{{ value }}<button style="color: blue" @click="cellAlert">button</button></template>
