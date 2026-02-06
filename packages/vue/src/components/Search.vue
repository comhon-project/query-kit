<script setup lang="ts">
import { ref, shallowRef, toRaw, watch, watchEffect } from 'vue';
import Collection from '@components/Collection/Collection.vue';
import Builder from '@components/Filter/Builder.vue';
import { resolve, type EntitySchema } from '@core/EntitySchema';
import { classes } from '@core/ClassManager';
import { getUniqueId } from '@core/Utils';
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
  onRowClick?: (row: Record<string, unknown>, event: MouseEvent | KeyboardEvent) => void;
  quickSort?: boolean;
  postRequest?: (collection: Record<string, unknown>[]) => void | Promise<void>;
  allowedCollectionTypes?: CollectionType[];
  displayCount?: boolean;
  editColumns?: boolean;
  onExport?: (filter?: Record<string, unknown>) => void;
}

interface Emits {
  rowClick: [row: Record<string, unknown>, event: MouseEvent | KeyboardEvent];
  export: [filter?: Record<string, unknown>];
  computed: [filter: Record<string, unknown>];
  updated: [filter: GroupFilter];
}

const emit = defineEmits<Emits>();
const columns = defineModel<string[]>('columns', { required: true });
const orderBy = defineModel<(string | OrderByItem)[]>('orderBy');
const page = defineModel<number>('page', { default: 1 });
const props = withDefaults(defineProps<Props>(), {
  filter: null,
  allowReset: true,
  displayOperator: true,
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
  manually: true,
  directQuery: true,
  deferred: 1000,
  quickSort: true,
  allowedCollectionTypes: () => ['pagination'],
});

let tempFilter: Record<string, unknown> | null = null;
const uniqueId = getUniqueId();
const builderId = 'qkit-filter-' + uniqueId;
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
  location.hash = collectionId;
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
  location.hash = collectionId;
}

function goToBuilder(): void {
  location.hash = builderId;
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
    <Builder
      :id="builderId"
      v-bind="props"
      v-model="builtFilter"
      :collection-id="collectionId"
      :on-validate="manually ? applyQuery : undefined"
      @computed="updateFilter"
      @go-to-collection="goToCollection"
    />
    <Collection
      v-if="computedFilter !== false"
      :id="collectionId"
      v-bind="props"
      v-model:columns="columns"
      v-model:order-by="orderBy"
      v-model:page="page"
      :filter="computedFilter"
      :builder-id="builderId"
      @go-to-builder="goToBuilder"
    >
      <template #loading="loadingProps">
        <slot name="loading" v-bind="loadingProps" />
      </template>
    </Collection>
  </div>
</template>
