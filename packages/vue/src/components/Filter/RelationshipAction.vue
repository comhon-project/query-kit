<script setup lang="ts">
import { ref, inject } from 'vue';
import type { EntitySchema } from '@core/EntitySchema';
import { useFilterWithOperator } from '@components/Filter/Composable/FilterWithOperator';
import { useSearchable } from '@components/Filter/Composable/Searchable';
import ConditionChoice from '@components/Filter/ConditionChoice.vue';
import IconButton from '@components/Common/IconButton.vue';
import { type RelationshipConditionFilter, type Filter } from '@core/types';
import { builderConfigKey } from '@core/InjectionKeys';

interface Props {
  modelValue: RelationshipConditionFilter;
  entitySchema: EntitySchema;
}

interface Emits {
  remove: [];
  add: [filter: Filter];
}

const emit = defineEmits<Emits>();
const props = defineProps<Props>();
const config = inject(builderConfigKey)!;
const showConditionChoice = ref<boolean>(false);
const { isEditable } = useFilterWithOperator(config, props);
const { hasSearchableItems } = useSearchable(config, props);

function addFilter(): void {
  showConditionChoice.value = true;
}

function setNewFilter(data: Filter): void {
  emit('add', data);
}
</script>

<template>
  <div>
    <IconButton v-if="hasSearchableItems && isEditable" icon="add_filter" @click="addFilter" />
    <ConditionChoice v-model:show="showConditionChoice" :entity-schema="entitySchema" @validate="setNewFilter" />
  </div>
</template>
