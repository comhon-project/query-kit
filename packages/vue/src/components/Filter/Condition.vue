<script setup lang="ts">
import { ref, watch, computed, watchEffect, inject } from 'vue';
import { useFilterWithOperator } from '@components/Filter/Composable/FilterWithOperator';
import { isValidOperator } from '@core/OperatorManager';
import {
  getPropertyTranslation,
  getLeafTypeContainer,
  type EntitySchema,
  type Property,
} from '@core/EntitySchema';
import InvalidProperty from '@components/Messages/InvalidProperty.vue';
import InvalidOperator from '@components/Messages/InvalidOperator.vue';
import InvalidType from '@components/Messages/InvalidType.vue';
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
  entitySchema: EntitySchema;
}

interface Emits {
  remove: [];
}

defineEmits<Emits>();

const props = defineProps<Props>();
const config = inject(builderConfigKey)!;

const validOperator = ref<boolean>(true);
const validProperty = ref<boolean>(true);
const validType = ref<boolean>(true);

const { isRemovable, isEditable, canEditOperator, operatorOptions } = useFilterWithOperator(config, props);

const mustDisplayOperator = computed<boolean>(() => {
  return (
    config.displayOperator === true ||
    (typeof config.displayOperator === 'object' && !!config.displayOperator.condition)
  );
});

const property = computed<Property | undefined>(() => {
  try {
    return props.entitySchema.getProperty(props.modelValue.property);
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

watchEffect(() => {
  validProperty.value = !!property.value;
  validOperator.value = isValidOperator('condition', props.modelValue.operator);
  if (property.value) {
    try {
      getComponent(getLeafTypeContainer(property.value));
      validType.value = true;
    } catch {
      validType.value = false;
    }
  }
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
</script>

<template>
  <div :class="classes.condition_container">
    <div>
      <InvalidProperty v-if="!validProperty" :property="modelValue.property" />
      <InvalidOperator v-else-if="!validOperator" :operator="modelValue.operator" />
      <InvalidType v-else-if="!validType && property" :type-container="property" />
      <template v-else-if="property">
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
          :entity-schema="entitySchema"
          :editable="isEditable"
          :is-array="isArrayOperator"
        />
      </template>
    </div>
    <IconButton
      v-if="isRemovable || !validProperty || !validOperator || !validType"
      icon="delete"
      btn-class="btn_secondary"
      :aria-label="property ? translate('condition') + ' ' + propertyName : ''"
      @click="$emit('remove')"
    />
  </div>
</template>
