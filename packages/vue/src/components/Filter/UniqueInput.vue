<script setup lang="ts">
import { ref, computed, watchEffect, watch, type Component } from 'vue';
import { DateTime } from 'luxon';
import { classes } from '@core/ClassManager';
import { getComponent, isNativeHtmlComponent } from '@core/InputManager';
import {
  getLeafTypeContainer,
  getPropertyTranslation,
  getScopeParameterTranslation,
  type Property,
  type ScopeParameter,
  type RawScopeParameter,
} from '@core/EntitySchema';
import InvalidType from '@components/Messages/InvalidType.vue';
import { getComputedScopeParameterTranslation, type ComputedScopeParameter } from '@core/ComputedScopesManager';
import type { NativeHtmlComponent } from '@core/types';

interface Props {
  modelValue: unknown;
  multiple: boolean;
  target: Property | RawScopeParameter;
  entity: string;
  editable?: boolean;
  userTimezone?: string;
  requestTimezone?: string;
}

interface Emits {
  'update:modelValue': [value: unknown];
}

const emit = defineEmits<Emits>();

const props = withDefaults(defineProps<Props>(), {
  editable: true,
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
});

const conditionValue = ref<unknown>(null);

const inputType = computed<NativeHtmlComponent | Component | undefined>(() => {
  try {
    return getComponent(getLeafTypeContainer(props.target));
  } catch {
    return undefined;
  }
});

const isVueComponent = computed<boolean>(() => {
  return !!inputType.value && !isNativeHtmlComponent(inputType.value);
});

const ariaLabel = computed<string>(() => {
  if ('scopeId' in props.target) {
    return getScopeParameterTranslation(props.target as ScopeParameter);
  }
  if ('owner' in props.target) {
    return getPropertyTranslation(props.target);
  }
  return getComputedScopeParameterTranslation(props.target as ComputedScopeParameter);
});

function getConditionValueFromModelValue(): unknown {
  if (props.modelValue == null) {
    return null;
  }
  switch (inputType.value) {
    case 'datetime-local': {
      const date = DateTime.fromISO(props.modelValue as string, { zone: props.requestTimezone }).setZone(
        props.userTimezone,
      );
      return `${date.toFormat('yyyy-LL-dd')}T${date.toFormat('TT')}`;
    }
    default:
      return props.modelValue;
  }
}

function getModelValueFromConditionValue(value: unknown): unknown {
  switch (inputType.value) {
    case 'datetime-local':
      return DateTime.fromISO(value as string, { zone: props.userTimezone })
        .setZone(props.requestTimezone)
        .toISO();
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
  <InvalidType v-if="!inputType" :type-container="target" />
  <component
    v-else-if="isVueComponent"
    :is="inputType"
    v-model="conditionValue"
    :entity="entity"
    :target="target"
    :multiple="multiple"
    :disabled="!editable"
    :aria-label="ariaLabel"
  />
  <input
    v-else
    v-model="conditionValue"
    :class="classes.input"
    :type="inputType as NativeHtmlComponent"
    :disabled="!editable"
    :aria-label="ariaLabel"
  />
</template>
