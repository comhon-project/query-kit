<script setup>
import { reactive, watch } from 'vue';
import { classes } from '../../core/ClassManager';
import IconButton from '../Common/IconButton.vue';
import InputCondition from './InputCondition.vue';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: Object,
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

const arrayValues = reactive(props.modelValue ? [...props.modelValue] : [undefined]);
watch(arrayValues, () => emit('update:modelValue', arrayValues));
</script>

<template>
  <div :class="classes.in_container">
    <ul :class="classes.in_list">
      <li :class="classes.in_value_container" v-for="(value, index) in arrayValues">
        <InputCondition
          v-bind="props"
          :model-value="value"
          @update:model-value="(newValue) => (arrayValues[index] = newValue)"
          :editable="editable"
        />
        <IconButton v-if="editable" icon="delete" @click="() => arrayValues.splice(index, 1)" />
      </li>
    </ul>
    <IconButton v-if="editable" icon="add_value" @click="() => arrayValues.push(undefined)" />
  </div>
</template>
