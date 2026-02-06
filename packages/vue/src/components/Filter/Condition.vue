<script setup lang="ts">
import { ref, watch, computed, watchEffect, inject } from 'vue';
import { useFilterWithOperator } from '@components/Filter/Composable/FilterWithOperator';
import { isValidOperator } from '@core/OperatorManager';
import {
  resolve,
  getPropertyTranslation,
  getLeafTypeContainer,
  type EntitySchema,
  type Property,
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
import { type ConditionFilter } from '@core/types';
import { builderConfigKey } from '@core/InjectionKeys';

interface Props {
  modelValue: ConditionFilter;
  entity: string;
}

interface Emits {
  remove: [];
}

defineEmits<Emits>();

const props = defineProps<Props>();
const config = inject(builderConfigKey)!;

const validEntity = ref<boolean>(true);
const validOperator = ref<boolean>(true);
const validProperty = ref<boolean>(true);
const validType = ref<boolean>(true);
const schema = ref<EntitySchema | null>(null);

const { isRemovable, isEditable, canEditOperator, operatorOptions } = useFilterWithOperator(
  props.modelValue,
  config,
  schema,
);

const mustDisplayOperator = computed<boolean>(() => {
  return (
    config.displayOperator === true ||
    (typeof config.displayOperator === 'object' && !!config.displayOperator.condition)
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
  if (schema.value && property.value) {
    try {
      getComponent(getLeafTypeContainer(property.value));
    } catch {
      validType.value = false;
    }
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
      <InvalidType v-else-if="!validType && property" :type-container="property" />
      <template v-else-if="schema && property">
        <div :class="classes.condition_header">
          <slot name="relationship" />
          <span :class="classes.property_name_container">{{ propertyName }}</span>
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
          v-if="modelValue.operator != 'null' && modelValue.operator != 'not_null'"
          v-model="modelValue.value"
          :target="property"
          :entity="entity"
          :editable="isEditable"
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
