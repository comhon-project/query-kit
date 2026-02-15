<script setup lang="ts">
import { shallowRef } from 'vue';
import Collection from '@components/Collection/Collection.vue';
import Builder from '@components/Filter/Builder.vue';
import { classes } from '@core/ClassManager';
import { getUniqueId } from '@core/Utils';
import type { AllowedOperators } from '@core/OperatorManager';
import type {
  Filter,
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
  allowReset?: boolean;
  allowUndo?: boolean;
  allowRedo?: boolean;
  allowedScopes?: AllowedScopes;
  allowedProperties?: AllowedProperties;
  allowedOperators?: AllowedOperators;
  displayOperator?: DisplayOperator;
  userTimezone?: string;
  requestTimezone?: string;
  requester?: Requester | RequesterFunction;
  postRequest?: (collection: Record<string, unknown>[]) => void | Promise<void>;
  manually?: boolean;
  directQuery?: boolean;
  debounce?: number;
  limit: number;
  quickSort?: boolean;
  allowedCollectionTypes?: CollectionType[];
  displayCount?: boolean;
  editColumns?: boolean;
  onRowClick?: (row: Record<string, unknown>, event: MouseEvent | KeyboardEvent) => void;
  onExport?: (filter?: Filter) => void;
}

const filter = defineModel<Filter | null>('filter', { default: null });
const columns = defineModel<string[]>('columns', { required: true });
const orderBy = defineModel<(string | OrderByItem)[]>('orderBy');
const page = defineModel<number>('page', { default: 1 });
const props = withDefaults(defineProps<Props>(), {
  manually: true,
});

let tempFilter: Filter | null = null;
const uniqueId = getUniqueId();
const builderId = 'qkit-filter-' + uniqueId;
const collectionId = 'qkit-collection-' + uniqueId;
const computedFilter = shallowRef<Filter | false>(false);

function applyQuery(): void {
  // we copy object filter if it didn't changed to force reload collection
  if (tempFilter) {
    computedFilter.value = computedFilter.value === tempFilter ? Object.assign({}, tempFilter) : tempFilter;
  }
  location.hash = collectionId;
}

function updateComputedFilter(filter: Filter): void {
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
</script>

<template>
  <div :class="classes.search">
    <Builder
      :id="builderId"
      v-bind="props"
      v-model="filter"
      :collection-id="collectionId"
      :on-validate="manually ? applyQuery : undefined"
      @computed="updateComputedFilter"
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
