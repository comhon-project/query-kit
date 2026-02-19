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
  manual?: boolean;
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
  manual: true,
});

const uniqueId = getUniqueId();
const builderId = 'qkit-filter-' + uniqueId;
const collectionId = 'qkit-collection-' + uniqueId;
const computedFilter = shallowRef<Filter>();

function onComputed(filter: Filter, manual: boolean): void {
  computedFilter.value = filter;
  if (manual) {
    location.hash = collectionId;
  }
}

</script>

<template>
  <div :class="classes.search">
    <Builder
      :id="builderId"
      v-bind="props"
      v-model="filter"
      :collection-id="collectionId"
      @computed="onComputed"
    />
    <Collection
      v-if="computedFilter"
      :id="collectionId"
      v-bind="props"
      v-model:columns="columns"
      v-model:order-by="orderBy"
      v-model:page="page"
      :filter="computedFilter"
      :builder-id="builderId"
    />

  </div>
</template>
