<script setup>
import { ref, watch, computed, watchEffect } from 'vue';
import { useBaseFilter } from './Composable/BaseFilter';
import { isValidOperator } from '../../core/OperatorManager';
import { resolve } from '../../core/Schema';
import InvalidProperty from '../Messages/InvalidProperty.vue';
import InvalidScope from '../Messages/InvalidScope.vue';
import InvalidOperator from '../Messages/InvalidOperator.vue';
import InvalidType from '../Messages/InvalidType.vue';
import InvalidModel from '../Messages/InvalidModel.vue';
import AdaptativeSelect from '../Common/AdaptativeSelect.vue';
import InputCollection from './InputCollection.vue';
import InputCondition from './InputCondition.vue';
import IconButton from '../Common/IconButton.vue';
import { classes } from '../../core/ClassManager';
import { getComponent, isUniqueComponentIn } from '../../core/InputManager';
import { locale, translate } from '../../i18n/i18n';

defineEmits(['remove']);
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  computedScopes: {
    type: Object, // {modelname: [{id: 'scope_one', name: 'scope one', type: 'string', useOperator: true, computed: () => {...})}, ...], ...}
    default: undefined,
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
const validModel = ref(true);
const validOperator = ref(true);
const validTarget = ref(true);
const validType = ref(true);
const schema = ref(null);
const { isRemovable, isEditable, canEditOperator, operatorOptions } = useBaseFilter(
  props,
  schema,
  props.modelValue.type
);

const inputType = computed(() => {
  return getComponent(containerType.value.type, containerType.value.enum);
});
const containerType = computed(() => {
  let container = target.value;
  if (container) {
    while (container.type == 'array') {
      container = container.children;
    }
  }
  return container;
});
const useOperator = computed(() => {
  return props.modelValue.type == 'condition' || target.value.useOperator;
});
const mustDisplayOperator = computed(() => {
  return (
    useOperator.value && (props.displayOperator === true || (props.displayOperator && props.displayOperator.condition))
  );
});
const target = computed(() => {
  // may be condition, scope or computed scope
  if (props.modelValue.type == 'condition') {
    return schema.value.mapProperties[props.modelValue.property];
  }
  const computedScope =
    props.computedScopes && props.computedScopes[props.model]
      ? props.computedScopes[props.model].find((scope) => scope.id == props.modelValue.id)
      : null;

  return computedScope ? computedScope : schema.value.mapScopes[props.modelValue.id];
});
const targetName = computed(() => {
  const currentLocale = locale.value;
  return target.value.translation ? target.value.translation(currentLocale) : target.value.name;
});
const isUniqueIn = computed(() => {
  return isUniqueComponentIn(containerType.value.type);
});

async function initSchema() {
  schema.value = await resolve(props.model);
  if (!schema.value) {
    validModel.value = false;
    return;
  }
  verifyTarget();
  verifyOperator();
  verifyType();
}

function verifyTarget() {
  if (schema.value && !target.value) {
    validTarget.value = false;
  }
}

function verifyOperator() {
  if (schema.value && useOperator.value && !isValidOperator('condition', props.modelValue.operator)) {
    validOperator.value = false;
  }
}

function verifyType() {
  if (
    schema.value &&
    target.value &&
    (props.modelValue.type == 'condition' || containerType.value.type) &&
    !getComponent(containerType.value.type, containerType.value.enum)
  ) {
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
  }
);
watch(
  () => props.modelValue.property,
  () => {
    verifyType();
    verifyTarget();
  }
);
watch(
  () => props.modelValue.id,
  () => {
    verifyType();
    verifyTarget();
  }
);
</script>

<template>
  <div :class="classes.condition_container" tabindex="0" :aria-label="ariaLabel ?? translate('condition')">
    <div>
      <slot name="shortcuts" />
      <InvalidModel v-if="!validModel" :model="modelValue.model" />
      <template v-else-if="!validTarget">
        <InvalidProperty v-if="modelValue.type == 'condition'" :property="modelValue.property" />
        <InvalidScope v-else :id="modelValue.id" />
      </template>
      <InvalidOperator v-else-if="!validOperator" :operator="modelValue.operator" />
      <InvalidType v-else-if="!validType" :type="containerType.type" />
      <template v-else-if="schema">
        <div :class="classes.condition_header">
          <slot name="relationship" />
          <label :class="classes.property_name_container">{{ targetName }}</label>
          <template v-if="mustDisplayOperator">
            <AdaptativeSelect
              v-model="modelValue.operator"
              :class="classes.operator"
              :options="operatorOptions"
              :disabled="!canEditOperator"
              :aria-label="targetName + ' ' + translate('operator')"
            />
          </template>
        </div>
        <template v-if="inputType">
          <template v-if="modelValue.operator != 'null' && modelValue.operator != 'not_null'">
            <InputCollection
              v-if="!isUniqueIn && (modelValue.operator == 'in' || modelValue.operator == 'not_in')"
              v-bind="props"
              v-model="modelValue.value"
              :operator="modelValue.operator"
              :target="target"
              :editable="isEditable"
            />
            <InputCondition
              v-else
              v-bind="props"
              v-model="modelValue.value"
              :operator="modelValue.operator"
              :target="target"
              :editable="isEditable"
            />
          </template>
        </template>
      </template>
    </div>
    <IconButton
      v-if="isRemovable || !validModel || !validTarget || !validOperator || !validType"
      icon="delete"
      btn-class="btn_secondary"
      :aria-label="schema && target ? translate('condition') + ' ' + targetName : ''"
      @click="$emit('remove')"
    />
  </div>
</template>
