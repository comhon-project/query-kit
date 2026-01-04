<script setup>
import { ref, watch, computed, watchEffect } from 'vue';
import { useBaseFilter } from '@components/Filter/Composable/BaseFilter';
import { isValidOperator } from '@core/OperatorManager';
import { resolve, getPropertyTranslation } from '@core/EntitySchema';
import InvalidProperty from '@components/Messages/InvalidProperty.vue';
import InvalidOperator from '@components/Messages/InvalidOperator.vue';
import InvalidType from '@components/Messages/InvalidType.vue';
import InvalidEntity from '@components/Messages/InvalidEntity.vue';
import AdaptativeSelect from '@components/Common/AdaptativeSelect.vue';
import InputCollection from '@components/Filter/InputCollection.vue';
import InputCondition from '@components/Filter/InputCondition.vue';
import IconButton from '@components/Common/IconButton.vue';
import { classes } from '@core/ClassManager';
import { getComponent, isUniqueComponentIn } from '@core/InputManager';
import { translate } from '@i18n/i18n';

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
  allowedOperators: {
    type: Object, // {condition: ['=', '<>', ...], group: ['AND', 'OR'], relationship_condition: ['HAS', 'HAS_NOT']}
    default: undefined,
  },
  displayOperator: {
    type: [Boolean, Object],
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
  ariaLabel: {
    type: String,
    default: undefined,
  },
});
const validEntity = ref(true);
const validOperator = ref(true);
const validProperty = ref(true);
const validType = ref(true);
const schema = ref(null);
const { isRemovable, isEditable, canEditOperator, operatorOptions } = useBaseFilter(
  props,
  schema,
  props.modelValue.type,
);

const inputType = computed(() => {
  return getComponent(containerType.value.type, containerType.value.enum);
});
const containerType = computed(() => {
  let container = property.value;
  if (container) {
    while (container.type == 'array') {
      container = container.children;
    }
  }
  return container;
});
const mustDisplayOperator = computed(() => {
  return props.displayOperator === true || (props.displayOperator && props.displayOperator.condition);
});
const property = computed(() => {
  return schema.value.mapProperties[props.modelValue.property];
});
const propertyName = computed(() => {
  return getPropertyTranslation(property.value);
});
const isUniqueIn = computed(() => {
  return isUniqueComponentIn(containerType.value.type);
});

async function initSchema() {
  schema.value = await resolve(props.entity);
  if (!schema.value) {
    validEntity.value = false;
    return;
  }
  verifyProperty();
  verifyOperator();
  verifyType();
}

function verifyProperty() {
  if (schema.value && !property.value) {
    validProperty.value = false;
  }
}

function verifyOperator() {
  if (schema.value && !isValidOperator('condition', props.modelValue.operator)) {
    validOperator.value = false;
  }
}

function verifyType() {
  if (schema.value && property.value && !getComponent(containerType.value.type, containerType.value.enum)) {
    validType.value = false;
  }
}

watchEffect(initSchema);
watchEffect(() => {
  if (props.modelValue.operator && !isValidOperator('condition', props.modelValue.operator)) {
    props.modelValue.operator = props.modelValue.operator.toLowerCase();
  }
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
    const hasToggleOperatorIn = isOldOperatorIn ^ isNewOperatorIn;

    if (hasToggleOperatorIn) {
      if (isOldOperatorIn && Array.isArray(props.modelValue.value)) {
        props.modelValue.value = props.modelValue?.value?.[0];
      }
      if (isNewOperatorIn && !Array.isArray(props.modelValue.value)) {
        props.modelValue.value = [props.modelValue.value];
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
  <div :class="classes.condition_container" tabindex="0" :aria-label="ariaLabel ?? translate('condition')">
    <div>
      <slot name="shortcuts" />
      <InvalidEntity v-if="!validEntity" :entity="modelValue.model" />
      <InvalidProperty v-else-if="!validProperty" :property="modelValue.property" />
      <InvalidOperator v-else-if="!validOperator" :operator="modelValue.operator" />
      <InvalidType v-else-if="!validType" :type="containerType.type" />
      <template v-else-if="schema">
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
        <template v-if="inputType && modelValue.operator != 'null' && modelValue.operator != 'not_null'">
          <InputCollection
            v-if="!isUniqueIn && (modelValue.operator == 'in' || modelValue.operator == 'not_in')"
            v-bind="props"
            v-model="modelValue.value"
            :operator="modelValue.operator"
            :target="property"
            :editable="isEditable"
          />
          <InputCondition
            v-else
            v-bind="props"
            v-model="modelValue.value"
            :operator="modelValue.operator"
            :target="property"
            :editable="isEditable"
          />
        </template>
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
