<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import {
  getScopeTranslation,
  getScopeParameterTranslation,
  type EntitySchema,
  type Scope as ScopeType,
  type ScopeParameter,
  type RawScopeParameter,
} from '@core/EntitySchema';
import InvalidScope from '@components/Messages/InvalidScope.vue';
import ArrayableInput from '@components/Filter/ArrayableInput.vue';
import IconButton from '@components/Common/IconButton.vue';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import {
  getComputedScope,
  getComputedScopeTranslation,
  getComputedScopeParameterTranslation,
  type ComputedScope,
  type ComputedScopeParameter,
} from '@core/ComputedScopesManager';
import type { ScopeFilter } from '@core/types';

interface ParameterWithTranslation {
  param: ScopeParameter | RawScopeParameter;
  translation: string;
}

interface Props {
  modelValue: ScopeFilter;
  entitySchema: EntitySchema;
}

interface Emits {
  remove: [];
}

defineEmits<Emits>();

const props = defineProps<Props>();

const validScope = ref<boolean>(true);

const isRemovable = computed<boolean>(() => props.modelValue.removable !== false);
const isEditable = computed<boolean>(() => props.modelValue.editable !== false);

const scope = computed<ComputedScope | ScopeType | null>(() => {
  const computedScope = getComputedScope(props.entitySchema.id, props.modelValue.id);
  if (computedScope) return computedScope;
  try {
    return props.entitySchema.getScope(props.modelValue.id);
  } catch {
    return null;
  }
});

const scopeName = computed<string>(() => {
  if (!scope.value) return '';
  return 'computed' in scope.value ? getComputedScopeTranslation(scope.value) : getScopeTranslation(scope.value);
});

const parametersWithTranslations = computed<ParameterWithTranslation[]>(() => {
  if (!scope.value?.parameters) return [];
  return scope.value.parameters.map((param) => ({
    param,
    translation:
      'scopeId' in param
        ? getScopeParameterTranslation(param)
        : getComputedScopeParameterTranslation(param as ComputedScopeParameter),
  }));
});

watchEffect(() => {
  validScope.value = !!scope.value;
  if (scope.value?.parameters?.length && props.modelValue.parameters == null) {
    props.modelValue.parameters = [];
  }
});
</script>

<template>
  <div :class="classes.condition_container">
    <div>
      <InvalidScope v-if="!validScope" :id="modelValue.id" />
      <template v-else-if="scope">
        <div :class="classes.condition_header">
          <slot name="relationship" />
          <span :class="classes.property_name_container">{{ scopeName }}</span>
        </div>
        <div v-if="parametersWithTranslations.length" :class="classes.scope_parameters">
          <div
            v-for="({ param, translation }, index) in parametersWithTranslations"
            :key="param.id"
            :class="classes.scope_parameter"
          >
            <span :class="classes.property_name_container">{{ translation }}</span>
            <ArrayableInput
              v-model="modelValue.parameters![index]"
              :target="param"
              :entity-schema="entitySchema"
              :editable="isEditable"
              :is-array="param.type === 'array'"
            />
          </div>
        </div>
      </template>
    </div>
    <IconButton
      v-if="isRemovable || !validScope"
      icon="delete"
      btn-class="btn_secondary"
      :aria-label="scope ? translate('scope') + ' ' + scopeName : ''"
      @click="$emit('remove')"
    />
  </div>
</template>
