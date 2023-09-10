<script setup>
import { ref, watchEffect } from 'vue';
import { resolve } from '../../core/Schema';
import { useBaseFilter } from './Composable/BaseFilter';
import ConditionChoice from './ConditionChoice.vue';
import IconButton from '../Common/IconButton.vue';

const emit = defineEmits(['remove', 'add']);
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
});
const schema = ref(null);
const showConditionChoice = ref(false);
const { canAddFilter } = useBaseFilter(props, schema, 'relationship_condition');

async function initSchema() {
  schema.value = await resolve(props.model);
}

function addFilter() {
  showConditionChoice.value = true;
}

async function setNewFilter(data) {
  emit('add', data);
}

watchEffect(initSchema);
</script>

<template>
  <div v-if="schema">
    <IconButton v-if="canAddFilter" icon="add_filter" @click="addFilter" />
    <ConditionChoice v-model:show="showConditionChoice" v-bind="props" :model="schema.name" @validate="setNewFilter" />
  </div>
</template>
