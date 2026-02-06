<script setup lang="ts">
import { ref, watchEffect, inject } from 'vue';
import { resolve, type EntitySchema } from '@core/EntitySchema';
import { useFilterWithOperator } from '@components/Filter/Composable/FilterWithOperator';
import ConditionChoice from '@components/Filter/ConditionChoice.vue';
import IconButton from '@components/Common/IconButton.vue';
import { type RelationshipConditionFilter, type Filter } from '@core/types';
import { builderConfigKey } from '@core/InjectionKeys';

interface Props {
  modelValue: RelationshipConditionFilter;
  entity: string;
}

interface Emits {
  remove: [];
  add: [filter: Filter];
}

const emit = defineEmits<Emits>();
const props = defineProps<Props>();
const config = inject(builderConfigKey)!;
const schema = ref<EntitySchema | null>(null);
const showConditionChoice = ref<boolean>(false);
const { canAddFilter } = useFilterWithOperator(props.modelValue, config, schema);

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
    <ConditionChoice v-model:show="showConditionChoice" :entity="schema.id" @validate="setNewFilter" />
  </div>
</template>
