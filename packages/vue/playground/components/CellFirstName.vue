<script setup>
const props = defineProps({
  columnId: {
    type: String,
    required: true,
  },
  property: {
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
  alert(
    "|| " +
      props.rowValue["company.id"] + // flattened
      " - " +
      props.rowValue["company.brand_name"] + // flattened
      " ||\n|| " +
      props.rowValue?.company?.id + // not flattened
      " - " +
      props.rowValue?.company?.brand_name + // not flattened
      " || "
  );
}
</script>

<template>
  {{ value }}<button style="color: blue" @click="cellAlert">button</button>
</template>
