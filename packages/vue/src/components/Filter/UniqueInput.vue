<script setup lang="ts">
import { computed, inject, type Component } from 'vue';
import { classes } from '@core/ClassManager';
import { getComponent, getSettings, isNativeHtmlComponent } from '@core/InputManager';
import { useWorkingValue } from '@components/Composable/WorkingValue';
import {
  getLeafTypeContainer,
  getPropertyTranslation,
  getScopeParameterTranslation,
  type EntitySchema,
  type Property,
  type ScopeParameter,
  type RawScopeParameter,
} from '@core/EntitySchema';
import InvalidType from '@components/Messages/InvalidType.vue';
import { getComputedScopeParameterTranslation, type ComputedScopeParameter } from '@core/ComputedScopesManager';
import { type NativeHtmlComponent } from '@core/types';
import { filterBuilderConfigKey } from '@core/InjectionKeys';

interface Props {
  multiple: boolean;
  target: Property | RawScopeParameter;
  entitySchema: EntitySchema;
  editable?: boolean;
}

const modelValue = defineModel<unknown>();

const props = withDefaults(defineProps<Props>(), {
  editable: true,
});
const config = inject(filterBuilderConfigKey)!;

// undefined for computed scope parameters (no owner)
const propertyOrScope = computed(() => 'owner' in props.target ? props.target : undefined);

const inputType = computed<NativeHtmlComponent | Component | undefined>(() => {
  try {
    return getComponent(getLeafTypeContainer(props.target), propertyOrScope.value);
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

const settings = (() => {
  try {
    return getSettings(getLeafTypeContainer(props.target), propertyOrScope.value);
  } catch {
    return {};
  }
})();

const workingValue = useWorkingValue<unknown>(modelValue, {
  transform:
    settings.trim || settings.emptyToUndefined
      ? (value) => {
          let next = value;
          if (settings.trim && typeof next === 'string') next = next.trim();
          if (settings.emptyToUndefined && (next === '' || next === null)) next = undefined;
          return next;
        }
      : undefined,
  delay: settings.debounce,
});
</script>

<template>
  <InvalidType v-if="!inputType" :type-container="target" />
  <component
    v-else-if="isVueComponent"
    :is="inputType"
    v-model="workingValue"
    :entity-schema="entitySchema"
    :target="target"
    :multiple="multiple"
    :user-timezone="config.userTimezone"
    :request-timezone="config.requestTimezone"
    :disabled="!editable"
    :aria-label="ariaLabel"
  />
  <input
    v-else
    v-model="workingValue"
    :class="classes.input"
    :type="inputType as NativeHtmlComponent"
    :disabled="!editable"
    :aria-label="ariaLabel"
  />
</template>
