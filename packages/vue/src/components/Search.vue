<script setup lang="ts">
import { ref, shallowRef, toRaw, watch, watchEffect } from 'vue';
import Collection from '@components/Collection/Collection.vue';
import Builder from '@components/Filter/Builder.vue';
import { resolve, type EntitySchema } from '@core/EntitySchema';
import IconButton from '@components/Common/IconButton.vue';
import { classes } from '@core/ClassManager';
import { getUniqueId } from '@core/Utils';
import Shortcuts from '@components/Filter/Shortcuts.vue';
import { getContainerOperators, type AllowedOperators } from '@core/OperatorManager';
import type {
  GroupFilter,
  DisplayOperator,
  AllowedScopes,
  AllowedProperties,
  CustomColumnConfig,
  OrderByItem,
  CollectionType,
  Requester,
  RequesterFunction,
} from '@core/types';

interface Props {
  entity: string;
  columns: string[];
  customColumns?: Record<string, CustomColumnConfig>;
  filter?: GroupFilter | null;
  allowReset?: boolean;
  allowedScopes?: AllowedScopes;
  allowedProperties?: AllowedProperties;
  allowedOperators?: AllowedOperators;
  displayOperator?: DisplayOperator;
  userTimezone?: string;
  requestTimezone?: string;
  requester?: Requester | RequesterFunction;
  manually?: boolean;
  directQuery?: boolean;
  deferred?: number;
  limit: number;
  offset?: number;
  onRowClick?: (row: Record<string, unknown>, event: MouseEvent) => void;
  quickSort?: boolean;
  orderBy?: (string | OrderByItem)[];
  postRequest?: (collection: Record<string, unknown>[]) => void | Promise<void>;
  allowedCollectionTypes?: CollectionType[];
  displayCount?: boolean;
  editColumns?: boolean;
  onExport?: (filter?: Record<string, unknown>) => void;
}

interface Emits {
  rowClick: [row: Record<string, unknown>, event: MouseEvent];
  export: [filter?: Record<string, unknown>];
  computed: [filter: Record<string, unknown>];
  updated: [filter: GroupFilter];
  'update:columns': [columns: string[]];
  'update:orderBy': [orderBy: OrderByItem[]];
}

const emit = defineEmits<Emits>();
const props = withDefaults(defineProps<Props>(), {
  filter: null,
  allowReset: true,
  displayOperator: true,
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
  manually: true,
  directQuery: true,
  deferred: 1000,
  offset: 0,
  quickSort: true,
  allowedCollectionTypes: () => ['pagination'],
});

let tempFilter: Record<string, unknown> | null = null;
const uniqueId = getUniqueId();
const filterId = 'qkit-filter-' + uniqueId;
const collectionId = 'qkit-collection-' + uniqueId;
const schema = ref<EntitySchema | null>(null);
const builtFilter = ref<GroupFilter>(null!);
const computedFilter = shallowRef<Record<string, unknown> | false>(false);

async function initSchema(): Promise<void> {
  schema.value = await resolve(props.entity);
}

function getInitialFilter(): GroupFilter {
  const initialFilter: GroupFilter = props.filter
    ? structuredClone(toRaw(props.filter))
    : {
        type: 'group',
        filters: [],
        operator: getContainerOperators('group', props.allowedOperators)?.[0] || 'and',
      };
  initialFilter.removable = false;

  return initialFilter;
}

function applyQuery(): void {
  // we copy object filter if it didn't changed to force reload collection
  if (tempFilter) {
    computedFilter.value = computedFilter.value === tempFilter ? Object.assign({}, tempFilter) : tempFilter;
  }
  location.href = `#${collectionId}`;
}

function updateFilter(filter: Record<string, unknown>): void {
  tempFilter = filter;

  // if computedFilter.value === false, this is the initialization of the computed filter
  // (there are no user interaction yet)
  if (!props.manually || computedFilter.value === false) {
    computedFilter.value = filter;
  }
}

function goToCollection(): void {
  location.href = `#${collectionId}`;
  document.getElementById(collectionId)?.focus();
}

function goToFilter(): void {
  location.href = `#${filterId}`;
  document.getElementById(filterId)?.focus();
}

watchEffect(() => {
  initSchema();
  builtFilter.value = getInitialFilter();
});
watch(computedFilter, () => {
  emit('updated', structuredClone(toRaw(builtFilter.value!)));
  emit('computed', structuredClone(toRaw(computedFilter.value as Record<string, unknown>)));
});
</script>

<template>
  <div v-if="schema" :class="classes.search">
    <Builder v-bind="props" :id="filterId" v-model="builtFilter" @computed="updateFilter">
      <template #validate>
        <IconButton v-if="manually" icon="search" @click="applyQuery" />
      </template>
      <template #shortcuts>
        <Shortcuts @go-to-collection="goToCollection" />
      </template>
    </Builder>
    <Collection
      v-if="computedFilter !== false"
      v-bind="props"
      :id="collectionId"
      :filter="computedFilter"
      @update:columns="(columns) => emit('update:columns', columns)"
      @update:order-by="(orderBy) => emit('update:orderBy', orderBy)"
    >
      <template #loading="loadingProps">
        <slot name="loading" v-bind="loadingProps" />
      </template>
      <template #shortcuts>
        <Shortcuts @go-to-filter="goToFilter" />
      </template>
    </Collection>
  </div>
</template>
