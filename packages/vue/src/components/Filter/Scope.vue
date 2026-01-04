<script setup>
import { ref, computed, watchEffect } from 'vue';
import { resolve, getScopeTranslation, getScopeParameterTranslation } from '@core/EntitySchema';
import InvalidScope from '@components/Messages/InvalidScope.vue';
import InvalidEntity from '@components/Messages/InvalidEntity.vue';
import InputCondition from '@components/Filter/InputCondition.vue';
import InputCollection from '@components/Filter/InputCollection.vue';
import IconButton from '@components/Common/IconButton.vue';
import { classes } from '@core/ClassManager';
import { locale, translate } from '@i18n/i18n';

defineEmits(['remove']);
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  entity: {
    type: String,
    required: true,
  },
  computedScopes: {
    type: Object, // {entity: [{id: 'scope_one', parameters: [...], computed: () => {...})}, ...], ...}
    default: undefined,
  },
  userTimezone: {
    type: String,
    default: 'UTC',
  },
  requestTimezone: {
    type: String,
    default: 'UTC',
  },
  ariaLabel: {
    type: String,
    default: undefined,
  },
});

const validEntity = ref(true);
const validScope = ref(true);
const schema = ref(null);

const isRemovable = computed(() => props.modelValue.removable !== false);
const isEditable = computed(() => props.modelValue.editable !== false);

const scope = computed(() => {
  if (!schema.value) return null;
  const computedScope =
    props.computedScopes && props.computedScopes[props.entity]
      ? props.computedScopes[props.entity].find((s) => s.id == props.modelValue.id)
      : null;
  return computedScope ?? schema.value.mapScopes[props.modelValue.id];
});

const scopeName = computed(() => {
  if (!scope.value) return '';
  const currentLocale = locale.value;
  if (scope.value.translation) {
    return scope.value.translation(currentLocale);
  }
  return getScopeTranslation(scope.value);
});

async function initSchema() {
  schema.value = await resolve(props.entity);
  if (!schema.value) {
    validEntity.value = false;
    return;
  }
  verifyScope();
}

function verifyScope() {
  if (schema.value && !scope.value) {
    validScope.value = false;
  }
}

watchEffect(initSchema);
</script>

<template>
  <div :class="classes.condition_container" tabindex="0" :aria-label="ariaLabel ?? translate('scope')">
    <div>
      <slot name="shortcuts" />
      <InvalidEntity v-if="!validEntity" :entity="modelValue.model" />
      <InvalidScope v-else-if="!validScope" :id="modelValue.id" />
      <template v-else-if="schema && scope">
        <div :class="classes.condition_header">
          <slot name="relationship" />
          <label :class="classes.property_name_container">{{ scopeName }}</label>
        </div>
        <div v-if="scope.parameters?.length" :class="classes.scope_parameters">
          <div v-for="(param, index) in scope.parameters" :key="param.id" :class="classes.scope_parameter">
            <label :class="classes.property_name_container">{{ getScopeParameterTranslation(entity, modelValue.id, param) }}</label>
            <InputCollection
              v-if="param.type === 'array'"
              v-model="modelValue.parameters[index]"
              :target="param"
              :entity="entity"
              :user-timezone="userTimezone"
              :request-timezone="requestTimezone"
              :editable="isEditable"
            />
            <InputCondition
              v-else
              v-model="modelValue.parameters[index]"
              :target="param"
              :entity="entity"
              :user-timezone="userTimezone"
              :request-timezone="requestTimezone"
              :editable="isEditable"
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
