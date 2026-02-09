<script setup>
import { locale } from "@query-kit/vue";
import { computed } from "vue";

const emit = defineEmits(["update:modelValue"]);
const props = defineProps({
  modelValue: {
    type: [Array, String],
    default: null,
  },
  target: {
    type: Object,
    required: true,
  },
  entitySchema: {
    type: Object,
    required: true,
  },
  multiple: {
    type: Boolean,
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
  const value = eventValue && props.multiple ? [eventValue] : eventValue;
  emit("update:modelValue", value);
}
</script>

<template>
  <select :disabled="disabled" @change="update">
    <option value="" />
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
