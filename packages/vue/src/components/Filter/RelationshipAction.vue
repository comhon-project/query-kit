<script setup>
import { ref, watchEffect } from 'vue';
import { resolve } from '../../core/Schema';
import { useBaseCondition } from './AbstractCondition';
import ConditionChoice from './ConditionChoice.vue';
import IconButton from '../Common/IconButton.vue';
import { classes } from '../../core/ClassManager';

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
const addFilterDialog = ref(null);
const { canAddFilter } = useBaseCondition(props, schema, 'relationship_condition');

async function initSchema() {
  schema.value = await resolve(props.model);
}

function addFilter() {
  addFilterDialog.value.showModal();
}

async function setNewFilter(data) {
  emit('add', data);
  addFilterDialog.value.close();
}

watchEffect(initSchema);
</script>

<template>
  <div v-if="schema">
    <IconButton v-if="canAddFilter" icon="add_filter" @click="addFilter" />
    <dialog ref="addFilterDialog" :class="classes.modal">
      <div :class="classes.modal_close_container">
        <IconButton icon="close" @click="() => addFilterDialog.close()" />
      </div>
      <ConditionChoice v-bind="props" :model="schema.name" @validate="setNewFilter" />
    </dialog>
  </div>
</template>
