<script setup>
import { locale } from "@query-kit/vue";
import { computed } from "vue";

const emit = defineEmits(["update:modelValue"]);
const props = defineProps({
  modelValue: {
    type: [Array, String],
  },
  target: {
    type: Object,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  operator: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    required: true,
  },
});
const computedValue = computed(() => {
  return Array.isArray(props.modelValue)
    ? props.modelValue[0]
    : props.modelValue;
});

function update(event) {
  const eventValue = event.target.value || null;
  const value =
    eventValue && (props.operator == "in" || props.operator == "not_in")
      ? [eventValue]
      : eventValue;
  emit("update:modelValue", value);
}
</script>

<template>
  <select @change="update" :disabled="disabled">
    <option value=""></option>
    <option value="1" :selected="computedValue == '1'">
      {{ locale == "fr" ? "angleterre" : "england" }}
    </option>
    <option value="2" :selected="computedValue == '2'">
      {{ locale == "fr" ? "france" : "france" }}
    </option>
    <option value="3" :selected="computedValue == '3'">
      {{ locale == "fr" ? "allemagne" : "deutshland" }}
    </option>
  </select>
</template>
