<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import {
  resolve,
  getScopeTranslation,
  getScopeParameterTranslation,
  type EntitySchema,
  type Scope as ScopeType,
} from '@core/EntitySchema';
import InvalidScope from '@components/Messages/InvalidScope.vue';
import InvalidEntity from '@components/Messages/InvalidEntity.vue';
import ArrayableInput from '@components/Filter/ArrayableInput.vue';
import IconButton from '@components/Common/IconButton.vue';
import { classes } from '@core/ClassManager';
import { locale, translate } from '@i18n/i18n';
import { getComputedScope, type ComputedScope } from '@core/ComputedScopesManager';
import type { ScopeFilter } from '@core/types';

interface Props {
  modelValue: ScopeFilter;
  entity: string;
  userTimezone?: string;
  requestTimezone?: string;
  ariaLabel?: string;
}

interface Emits {
  remove: [];
}

defineEmits<Emits>();

const props = withDefaults(defineProps<Props>(), {
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
});

const validEntity = ref<boolean>(true);
const validScope = ref<boolean>(true);
const schema = ref<EntitySchema | null>(null);

const isRemovable = computed<boolean>(() => props.modelValue.removable !== false);
const isEditable = computed<boolean>(() => props.modelValue.editable !== false);

const scope = computed<ComputedScope | ScopeType | null>(() => {
  if (!schema.value) return null;
  const computedScope = getComputedScope(props.entity, props.modelValue.id);
  if (computedScope) return computedScope;
  try {
    return schema.value.getScope(props.modelValue.id);
  } catch {
    return null;
  }
});

const scopeName = computed<string>(() => {
  if (!scope.value) return '';
  const currentLocale = locale.value;
  if ((scope.value as ComputedScope).translation) {
    return (scope.value as ComputedScope).translation!(currentLocale);
  }
  return getScopeTranslation(scope.value);
});

async function initSchema(): Promise<void> {
  schema.value = await resolve(props.entity);
  if (!schema.value) {
    validEntity.value = false;
    return;
  }
  verifyScope();
}

function verifyScope(): void {
  if (schema.value && !scope.value) {
    validScope.value = false;
  }
}

watchEffect(initSchema);

watchEffect(() => {
  if (scope.value?.parameters?.length && props.modelValue.parameters == null) {
    props.modelValue.parameters = [];
  }
});
</script>

<template>
  <div :class="classes.condition_container" tabindex="0" :aria-label="ariaLabel ?? translate('scope')">
    <div>
      <slot name="shortcuts" />
      <InvalidEntity v-if="!validEntity" :entity="entity" />
      <InvalidScope v-else-if="!validScope" :id="modelValue.id" />
      <template v-else-if="schema && scope">
        <div :class="classes.condition_header">
          <slot name="relationship" />
          <label :class="classes.property_name_container">{{ scopeName }}</label>
        </div>
        <div v-if="scope.parameters?.length" :class="classes.scope_parameters">
          <div v-for="(param, index) in scope.parameters" :key="param.id" :class="classes.scope_parameter">
            <label :class="classes.property_name_container">
              {{ getScopeParameterTranslation(entity, modelValue.id, param) }}
            </label>
            <ArrayableInput
              v-model="modelValue.parameters![index]"
              :target="param"
              :entity="entity"
              :editable="isEditable"
              :user-timezone="userTimezone"
              :request-timezone="requestTimezone"
              :is-array="param.type === 'array'"
            />
          </div>
        </div>
      </template>
    </div>
    <IconButton
      v-if="isRemovable || !validEntity || !validScope"
      icon="delete"
      btn-class="btn_secondary"
      :aria-label="scope ? translate('scope') + ' ' + scopeName : ''"
      @click="$emit('remove')"
    />
  </div>
</template>
