<script setup lang="ts">
import { ref, watch, computed, watchEffect } from 'vue';
import { useFilterWithOperator } from '@components/Filter/Composable/FilterWithOperator';
import { isValidOperator, type AllowedOperators } from '@core/OperatorManager';
import {
  resolve,
  getPropertyTranslation,
  type EntitySchema,
  type Property,
  type ArrayableTypeContainer,
} from '@core/EntitySchema';
import InvalidProperty from '@components/Messages/InvalidProperty.vue';
import InvalidOperator from '@components/Messages/InvalidOperator.vue';
import InvalidType from '@components/Messages/InvalidType.vue';
import InvalidEntity from '@components/Messages/InvalidEntity.vue';
import AdaptativeSelect from '@components/Common/AdaptativeSelect.vue';
import ArrayableInput from '@components/Filter/ArrayableInput.vue';
import IconButton from '@components/Common/IconButton.vue';
import { classes } from '@core/ClassManager';
import { getComponent } from '@core/InputManager';
import { translate } from '@i18n/i18n';
import type { ConditionFilter, DisplayOperator } from '@core/types';

interface Props {
  modelValue: ConditionFilter;
  entity: string;
  allowedOperators?: AllowedOperators;
  displayOperator?: DisplayOperator;
  userTimezone?: string;
  requestTimezone?: string;
}

interface Emits {
  remove: [];
}

defineEmits<Emits>();

const props = withDefaults(defineProps<Props>(), {
  displayOperator: true,
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
});

const validEntity = ref<boolean>(true);
const validOperator = ref<boolean>(true);
const validProperty = ref<boolean>(true);
const validType = ref<boolean>(true);
const schema = ref<EntitySchema | null>(null);

const { isRemovable, isEditable, canEditOperator, operatorOptions } = useFilterWithOperator(props, schema);

const inputType = computed(() => {
  if (!containerType.value) return undefined;
  return getComponent(containerType.value);
});

const containerType = computed<ArrayableTypeContainer | undefined>(() => {
  let container: ArrayableTypeContainer | undefined = property.value;
  if (container) {
    while (container.type == 'array' && container.children) {
      container = container.children;
    }
  }
  return container;
});

const mustDisplayOperator = computed<boolean>(() => {
  return (
    props.displayOperator === true || (typeof props.displayOperator === 'object' && !!props.displayOperator.condition)
  );
});

const property = computed<Property | undefined>(() => {
  if (!schema.value) return undefined;
  try {
    return schema.value.getProperty(props.modelValue.property);
  } catch {
    return undefined;
  }
});

const propertyName = computed<string>(() => {
  return property.value ? getPropertyTranslation(property.value) : '';
});

const isArrayOperator = computed<boolean>(() => {
  return props.modelValue.operator === 'in' || props.modelValue.operator === 'not_in';
});

async function initSchema(): Promise<void> {
  schema.value = await resolve(props.entity);
  if (!schema.value) {
    validEntity.value = false;
    return;
  }
  verifyProperty();
  verifyOperator();
  verifyType();
}

function verifyProperty(): void {
  if (schema.value && !property.value) {
    validProperty.value = false;
  }
}

function verifyOperator(): void {
  if (schema.value && !isValidOperator('condition', props.modelValue.operator)) {
    validOperator.value = false;
  }
}

function verifyType(): void {
  if (schema.value && property.value && containerType.value && !getComponent(containerType.value)) {
    validType.value = false;
  }
}

watchEffect(initSchema);

watchEffect(() => {
  verifyOperator();
});

watch(
  () => props.modelValue.operator,
  (newOperator, oldOperator) => {
    if (newOperator == 'null' || newOperator == 'not_null') {
      props.modelValue.value = undefined;
      return;
    }
    const isOldOperatorIn = oldOperator == 'in' || oldOperator == 'not_in';
    const isNewOperatorIn = newOperator == 'in' || newOperator == 'not_in';
    const hasToggleOperatorIn = isOldOperatorIn !== isNewOperatorIn;

    if (hasToggleOperatorIn) {
      if (isOldOperatorIn && Array.isArray(props.modelValue.value)) {
        props.modelValue.value = props.modelValue.value.length > 0 ? props.modelValue.value[0] : undefined;
      }
      if (isNewOperatorIn && !Array.isArray(props.modelValue.value)) {
        props.modelValue.value = props.modelValue.value !== undefined ? [props.modelValue.value] : undefined;
      }
    }
  },
);

watch(
  () => props.modelValue.property,
  () => {
    verifyType();
    verifyProperty();
  },
);
</script>

<template>
  <div :class="classes.condition_container">
    <div>
      <InvalidEntity v-if="!validEntity" :entity="entity" />
      <InvalidProperty v-else-if="!validProperty" :property="modelValue.property" />
      <InvalidOperator v-else-if="!validOperator" :operator="modelValue.operator" />
      <InvalidType v-else-if="!validType && containerType" :type="containerType.type" />
      <template v-else-if="schema && property">
        <div :class="classes.condition_header">
          <slot name="relationship" />
          <label :class="classes.property_name_container">{{ propertyName }}</label>
          <template v-if="mustDisplayOperator">
            <AdaptativeSelect
              v-model="modelValue.operator"
              :class="classes.operator"
              :options="operatorOptions"
              :disabled="!canEditOperator"
              :aria-label="propertyName + ' ' + translate('operator')"
            />
          </template>
        </div>
        <ArrayableInput
          v-if="inputType && modelValue.operator != 'null' && modelValue.operator != 'not_null'"
          v-model="modelValue.value"
          :target="property"
          :entity="entity"
          :editable="isEditable"
          :user-timezone="userTimezone"
          :request-timezone="requestTimezone"
          :is-array="isArrayOperator"
        />
      </template>
    </div>
    <IconButton
      v-if="isRemovable || !validEntity || !validProperty || !validOperator || !validType"
      icon="delete"
      btn-class="btn_secondary"
      :aria-label="schema && property ? translate('condition') + ' ' + propertyName : ''"
      @click="$emit('remove')"
    />
  </div>
</template>
