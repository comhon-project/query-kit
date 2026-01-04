<script setup>
import { ref, computed, watchEffect, watch } from 'vue';
import { DateTime } from 'luxon';
import { classes } from '@core/ClassManager';
import { getComponent, isNativeHtmlComponent } from '@core/InputManager';
import SelectEnum from '@components/Common/SelectEnum.vue';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    required: true,
    type: undefined,
  },
  operator: {
    type: String,
    default: undefined,
  },
  target: {
    type: Object,
    required: true,
  },
  entity: {
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
const inputType = computed(() => {
  return getComponent(containerType.value.type, containerType.value.enum);
});
const containerType = computed(() => {
  let container = props.target;
  if (container) {
    while (container.type == 'array') {
      container = container.children;
    }
  }
  return container;
});
const isVueComponent = computed(() => !isNativeHtmlComponent(inputType.value));

function getConditionValueFromModelValue() {
  if (props.modelValue == null) {
    return null;
  }
  switch (inputType.value) {
    case 'datetime-local': {
      const date = DateTime.fromISO(props.modelValue, { zone: props.requestTimezone }).setZone(props.userTimezone);
      return `${date.toFormat('yyyy-LL-dd')}T${date.toFormat('TT')}`;
    }
    default:
      return props.modelValue;
  }
}

function getModelValueFromConditionValue(value) {
  switch (inputType.value) {
    case 'datetime-local':
      return DateTime.fromISO(value, { zone: props.userTimezone }).setZone(props.requestTimezone).toISO();
    default:
      return value;
  }
}

watchEffect(() => {
  if (typeof props.modelValue == 'string' && props.modelValue.trim() == '') {
    emit('update:modelValue', undefined);
  } else {
    conditionValue.value = getConditionValueFromModelValue();
  }
});
watch(conditionValue, () => {
  let value = typeof conditionValue.value == 'string' ? conditionValue.value.trim() : conditionValue.value;
  if (value === null || value === '') {
    conditionValue.value = null;
    emit('update:modelValue', undefined);
  } else {
    emit('update:modelValue', getModelValueFromConditionValue(value));
  }
});
</script>

<template>
  <component
    :is="inputType"
    v-if="isVueComponent"
    v-model="conditionValue"
    :entity="entity"
    :target="target"
    :operator="operator"
    :disabled="!editable"
  />
  <SelectEnum
    v-else-if="inputType == 'select' && containerType.enum"
    v-model="conditionValue"
    :enum-id="containerType.enum"
    :disabled="!editable"
  />
  <input v-else v-model="conditionValue" :class="classes.input" :type="inputType" :disabled="!editable" />
</template>
