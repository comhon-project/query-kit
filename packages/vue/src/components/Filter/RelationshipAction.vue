<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { resolve, type EntitySchema } from '@core/EntitySchema';
import { useFilterWithOperator } from '@components/Filter/Composable/FilterWithOperator';
import ConditionChoice from '@components/Filter/ConditionChoice.vue';
import IconButton from '@components/Common/IconButton.vue';
import type { AllowedOperators } from '@core/OperatorManager';
import type { RelationshipConditionFilter, Filter, AllowedScopes, AllowedProperties } from '@core/types';

interface Props {
  modelValue: RelationshipConditionFilter;
  entity: string;
  allowedScopes?: AllowedScopes;
  allowedProperties?: AllowedProperties;
  allowedOperators?: AllowedOperators;
}

interface Emits {
  remove: [];
  add: [filter: Filter];
}

const emit = defineEmits<Emits>();
const props = defineProps<Props>();
const schema = ref<EntitySchema | null>(null);
const showConditionChoice = ref<boolean>(false);
const { canAddFilter } = useFilterWithOperator(props, schema);

async function initSchema(): Promise<void> {
  schema.value = await resolve(props.entity);
}

function addFilter(): void {
  showConditionChoice.value = true;
}

function setNewFilter(data: Filter): void {
  emit('add', data);
}

watchEffect(initSchema);
</script>

<template>
  <div v-if="schema">
    <IconButton v-if="canAddFilter" icon="add_filter" @click="addFilter" />
    <ConditionChoice v-model:show="showConditionChoice" v-bind="props" :entity="schema.id" @validate="setNewFilter" />
  </div>
</template>
