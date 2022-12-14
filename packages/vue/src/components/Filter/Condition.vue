<script setup>
  import { ref, watch, computed, watchEffect } from 'vue'
  import { useBaseCondition } from './AbstractCondition';
  import { operatorNames } from './FilterManager';
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
  import { translate } from '../../i18n/i18n';
  import Shortcuts from './Shortcuts.vue';

  const emit = defineEmits(['remove', 'goToNext', 'goToPrevious', 'goToParentGroup', 'goToRootGroup', 'addFilterToParentGroup']);
  const props = defineProps({
    modelValue: {
      type: Object,
      required: true
    },
    model: {
      type: String,
      required: true
    },
    computedScopes: {
      type: Object, // {modelname: [{id: 'scope_one', name: 'scope one', type: 'string', useOperator: true, computed: () => {...})}, ...], ...}
    },
    allowedOperators: {
      type: Object, // {condition: ['=', '<>', ...], group: ['AND', 'OR'], relationship_condition: ['HAS', 'HAS_NOT']}
    },
    displayOperator: {
      type: [Boolean, Object],
      default: true
    },
    userTimezone: {
      type: String,
      default: 'UTC'
    },
    requestTimezone: {
      type: String,
      default: 'UTC'
    },
    ariaLabel: {
      type: String,
    },
    exceptShortcuts: {
      type: Array,
    },
  });
  const validModel = ref(true);
  const validOperator = ref(true);
  const validTarget = ref(true);
  const validType = ref(true);
  const schema = ref(null);
  const { isRemovable, isEditable, canEditOperator, operatorOptions } = useBaseCondition(props, schema, props.modelValue.type);

  const shortcutEvents = {
    goToNext: () => emit('goToNext'),
    goToPrevious: () => emit('goToPrevious'),
    goToParentGroup: () => emit('goToParentGroup'),
    goToRootGroup: () => emit('goToRootGroup'),
    addFilterToParentGroup: () => emit('addFilterToParentGroup'),
  }

  const inputType = computed(() => {
    return getComponent(target.value.type, target.value.enum);
  });
  const useOperator = computed(() => {
    return props.modelValue.type == 'condition' || target.value.useOperator;
  });
  const mustDisplayOperator = computed(() => {
    return useOperator.value
      && (props.displayOperator === true || (props.displayOperator && props.displayOperator.condition));
  });
  const target = computed(() => {
    // may be condition, scope or computed scope
    if (props.modelValue.type == 'condition') {
      return schema.value.mapProperties[props.modelValue.property];
    }
    const computedScope = props.computedScopes && props.computedScopes[props.model]
      ? props.computedScopes[props.model].find(scope => scope.id == props.modelValue.id)
      : null;

    return computedScope ? computedScope : schema.value.mapScopes[props.modelValue.id];
  });
  const isUniqueIn = computed(() => {
    return isUniqueComponentIn(target.value.type);
  });

  async function initSchema()
  {
    schema.value = await resolve(props.model);
    if (!schema.value) {
      validModel.value = false;
      return;
    }
    verifyTarget();
    verifyOperator();
    verifyType();
  }

  function verifyTarget()
  {
    if (schema.value && !target.value) {
      validTarget.value = false;
    }
  }

  function verifyOperator()
  {
    if (schema.value && useOperator.value && !operatorNames['condition'][props.modelValue.operator]) {
      validOperator.value = false;
    }
  }

  function verifyType()
  {
    if (schema.value && target.value && (props.modelValue.type == 'condition' || target.value.type) && !getComponent(target.value.type, target.value.enum)) {
      validType.value = false;
    }
  }

  function removePercentageSymbole(value)
  {
    if (value != null) {
      if (value.charAt(0) == '%') {
        value = value.slice(1);
      }
      if (value.charAt(value.length - 1) == '%') {
        value = value.slice(0, -1);
      }
    }
    return value;
  }

  function addPercentageSymbole(value)
  {
    return value != null ? `%${value}%` : value;
  }

  watchEffect(initSchema);
  watchEffect(() => {
    if (props.modelValue.operator && !operatorNames['condition'][props.modelValue.operator]) {
      props.modelValue.operator = props.modelValue.operator.toLowerCase();
    }
    verifyOperator();
  });
  watch(() => props.modelValue.operator, (newOperator, oldOperator) => {
    
    if ((oldOperator == 'in' || oldOperator == 'not_in') && newOperator != 'in' && newOperator != 'not_in') {
      props.modelValue.value = props.modelValue.value && props.modelValue.value[0] 
        ? props.modelValue.value[0] : undefined;
    }
    if ((oldOperator == 'like' || oldOperator == 'not_like') && newOperator != 'like' && newOperator != 'not_like') {
      props.modelValue.value = removePercentageSymbole(props.modelValue.value);
    }
    if ((newOperator == 'in' || newOperator == 'not_in') && oldOperator != 'in' && oldOperator != 'not_in') {
      props.modelValue.value = [props.modelValue.value];
    }
    if ((newOperator == 'like' || newOperator == 'not_like') && oldOperator != 'like' && oldOperator != 'not_like') {
      props.modelValue.value = addPercentageSymbole(props.modelValue.value);
    }
  });
  watch(() => props.modelValue.property, () => {
    verifyType();
    verifyTarget();
  });
  watch(() => props.modelValue.id, () => {
    verifyType();
    verifyTarget();
  });
</script>

<template>
  <div :class="classes.condition_container" tabindex="0" :aria-label="ariaLabel ?? translate('condition')">
    <div>
      <Shortcuts v-on="shortcutEvents" :except="exceptShortcuts"/>
      <InvalidModel v-if="!validModel" :model="modelValue.model"/>
      <template v-else-if="!validTarget">
        <InvalidProperty v-if="modelValue.type == 'condition'" :property="modelValue.property"/>
        <InvalidScope v-else :id="modelValue.id"/>
      </template>
      <InvalidOperator v-else-if="!validOperator" :operator="modelValue.operator"/>
      <InvalidType v-else-if="!validType" :type="target.type"/>
      <template v-else-if="schema">
        <div :class="classes.condition_header">
          <slot name="relationship" />
          <label :class="classes.property_name_container">{{ target.name }}</label>
          <template v-if="mustDisplayOperator">
            <AdaptativeSelect :class="classes.operator" v-model="modelValue.operator" :options="operatorOptions" :disabled="!canEditOperator" :aria-label="target.name+' '+translate('operator')"/>
          </template>
        </div>
        <template v-if="inputType">
          <InputCollection v-if="!isUniqueIn && (modelValue.operator == 'in' || modelValue.operator == 'not_in')" v-bind="props" v-model="modelValue.value" :operator="modelValue.operator" :target="target" :editable="isEditable"/>
          <InputCondition  v-else  v-bind="props" v-model="modelValue.value" :operator="modelValue.operator" :target="target" :editable="isEditable"/>
        </template>
      </template>
    </div>
    <IconButton v-if="isRemovable || !validModel || !validTarget || !validOperator || !validType" icon="delete" @click="$emit('remove')" :aria-label="schema && target ? (translate('condition')+' '+target.name) : ''"/>
  </div>
</template>
