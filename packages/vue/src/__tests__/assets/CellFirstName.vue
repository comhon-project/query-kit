<script setup>
const props = defineProps({
  value: {
    required: true,
  },
  rowValue: {
    type: Object,
    required: true,
  },
});

function cellAlert(e) {
  e.stopPropagation();
  alert(props.rowValue['company.brand_name']);
}
</script>

<template>{{ value }}<button style="color: blue" @click="cellAlert">button</button></template>
