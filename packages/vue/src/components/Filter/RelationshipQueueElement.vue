<script setup>
import { computed, ref, watchEffect } from 'vue';
import { resolve } from '../../core/Schema';
import { useBaseCondition } from './AbstractCondition';
import AdaptativeSelect from '../Common/AdaptativeSelect.vue';
import { classes } from '../../core/ClassManager';
import { translate } from '../../i18n/i18n';

const emit = defineEmits(['remove', 'end:relationship']);
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
  allowedScopes: {
    type: Object, // {modelname: ['scope_one', 'scope_two', ...], ...}
    default: undefined,
  },
  allowedProperties: {
    type: Object, // {modelname: ['property_name_one', 'property_name_two', ...], ...}
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
});
const schema = ref(null);
const { canEditOperator, operatorOptions } = useBaseCondition(props, schema, 'relationship_condition');
const label = computed(() => schema.value.mapProperties[props.modelValue.property].name);

async function initSchema() {
  schema.value = await resolve(props.model);
}

watchEffect(initSchema);
</script>

<template>
  <div v-if="schema" :class="classes.relationship_queue_element">
    <div v-if="displayOperator === true || (displayOperator && displayOperator.relationship_condition)">
      <AdaptativeSelect
        v-model="modelValue.operator"
        :class="classes.operator"
        :options="operatorOptions"
        :disabled="!canEditOperator"
        :aria-label="label + ' ' + translate('operator')"
      />
    </div>
    <span :class="classes.property_name_container">
      {{ label }}
    </span>
  </div>
</template>
