<script setup>
import { ref, watch } from 'vue';
import { classes } from '@core/ClassManager';
import IconButton from '@components/Common/IconButton.vue';
import InputCondition from '@components/Filter/InputCondition.vue';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: Object,
    default: undefined,
  },
  operator: {
    type: String,
    required: true,
  },
  target: {
    type: Object,
    required: true,
  },
  editable: {
    type: Boolean,
    default: true,
  },
  model: {
    type: String,
    required: true,
  },
  userTimezone: {
    type: String,
    default: 'UTC',
  },
  requestTimezone: {
    type: String,
    default: 'UTC',
  },
});

const arrayValues = ref(props.modelValue ? [...props.modelValue] : [undefined]);

function addValue() {
  arrayValues.value.push(undefined);
  emit('update:modelValue', arrayValues.value);
}

function removeValue(index) {
  arrayValues.value.splice(index, 1);
  emit('update:modelValue', arrayValues.value);
}

function updateValue(value, index) {
  arrayValues.value[index] = value;
  emit('update:modelValue', arrayValues.value);
}

watch(
  () => props.modelValue,
  () => {
    arrayValues.value = props.modelValue ? [...props.modelValue] : [undefined];
  }
);
</script>

<template>
  <div :class="classes.in_container">
    <ul :class="classes.in_list">
      <li v-for="(value, index) in arrayValues" :key="index" :class="classes.in_value_container">
        <InputCondition
          v-bind="props"
          :model-value="value"
          :editable="editable"
          @update:model-value="(newValue) => updateValue(newValue, index)"
        />
        <IconButton v-if="editable" icon="delete" btn-class="btn_secondary" @click="() => removeValue(index)" />
      </li>
    </ul>
    <IconButton v-if="editable" icon="add_value" @click="addValue" />
  </div>
</template>
