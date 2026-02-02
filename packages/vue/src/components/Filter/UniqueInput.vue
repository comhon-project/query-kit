<script setup lang="ts">
import { computed, type Component } from 'vue';
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
  multiple: boolean;
  target: Property | RawScopeParameter;
  entity: string;
  editable?: boolean;
  userTimezone?: string;
  requestTimezone?: string;
}

const modelValue = defineModel<unknown>();

const props = withDefaults(defineProps<Props>(), {
  editable: true,
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
});

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

const conditionValue = computed<unknown>({
  get: () => modelValue.value,
  set: (value) => {
    const trimmed = typeof value == 'string' ? value.trim() : value;
    modelValue.value = trimmed === '' || trimmed === null ? undefined : trimmed;
  },
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
    :user-timezone="userTimezone"
    :request-timezone="requestTimezone"
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
