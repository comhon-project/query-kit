<script setup>
import { ref, computed, watchEffect, watch } from 'vue';
import { DateTime } from 'luxon';
import { classes } from '../../core/ClassManager';
import { getComponent } from '../../core/InputManager';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    required: true,
  },
  operator: {
    type: String,
  },
  target: {
    type: Object,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  editable: {
    type: Boolean,
    default: true,
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

const conditionValue = ref(null);
const isNullCondition = ref(false); // TODO manage 'is null' condition
const inputType = computed(() => {
  return getComponent(props.target.type, props.target.enum);
});
const isVueComponent = computed(() => typeof inputType.value != 'string');

function removePercentageSymbole(value, operator) {
  if (typeof value == 'string' && (operator == 'like' || operator == 'not_like')) {
    if (value.charAt(0) == '%') {
      value = value.slice(1);
    }
    if (value.charAt(value.length - 1) == '%') {
      value = value.slice(0, -1);
    }
  }
  return value;
}

function addPercentageSymbole(value, operator) {
  return value != null &&
    (typeof value == 'number' || value.charAt(0) != '%') &&
    (operator == 'like' || operator == 'not_like')
    ? `%${value}%`
    : value;
}

function getConditionValueFromModelValue() {
  const value = getNotEmptyModelValue();
  if (value == null) {
    return null;
  }
  switch (inputType.value) {
    case 'datetime-local':
      const date = DateTime.fromISO(value, { zone: props.requestTimezone }).setZone(props.userTimezone);
      return `${date.toFormat('yyyy-LL-dd')}T${date.toFormat('TT')}`;
    default:
      return removePercentageSymbole(value, props.operator);
  }
}

function getModelValueFromConditionValue(value) {
  switch (inputType.value) {
    case 'datetime-local':
      return DateTime.fromISO(value, { zone: props.userTimezone }).setZone(props.requestTimezone).toISO();
    default:
      return addPercentageSymbole(value, props.operator);
  }
}

function getNotEmptyModelValue() {
  let value = props.modelValue;
  if (typeof value == 'string' && value.trim() == '') {
    return undefined;
  }
  return value;
}

watchEffect(() => {
  if (props.modelValue !== getNotEmptyModelValue()) {
    emit('update:modelValue', getNotEmptyModelValue());
  } else {
    conditionValue.value = getConditionValueFromModelValue();
  }
});
watch(conditionValue, () => {
  let value = typeof conditionValue.value == 'string' ? conditionValue.value.trim() : conditionValue.value;
  if (isNullCondition.value) {
    conditionValue.value = null;
    emit('update:modelValue', null);
  } else if (value === null || value === '') {
    conditionValue.value = null;
    emit('update:modelValue', undefined);
  } else {
    emit('update:modelValue', getModelValueFromConditionValue(value));
  }
});
</script>

<template>
  <component
    v-if="isVueComponent"
    :is="inputType"
    v-model="conditionValue"
    :model="model"
    :target="target"
    :operator="operator"
    :disabled="!editable"
  />
  <select
    v-else-if="inputType == 'select' && target.enum"
    :class="classes.condition_input"
    v-model="conditionValue"
    :disabled="!editable"
  >
    <option v-for="(label, value) in target.enum" :key="value" :value="value">{{ label }}</option>
  </select>
  <input :class="classes.condition_input" v-else :type="inputType" v-model="conditionValue" :disabled="!editable" />
</template>
