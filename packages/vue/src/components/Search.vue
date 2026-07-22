<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import Collection from '@components/Collection/Collection.vue';
import QueryBuilder from '@components/QueryBuilder.vue';
import { classes } from '@core/ClassManager';
import { getUniqueId } from '@core/Utils';
import { config as globalConfig } from '@config/config';
import type { AllowedOperators } from '@core/OperatorManager';
import type {
  Filter,
  DisplayOperator,
  AllowedScopes,
  AllowedProperties,
  CustomFieldConfig,
  SortItemField,
  CollectionType,
  FieldsEditingLocation,
  SortEditingLocation,
  FilterEditingLocation,
  Requester,
  RequesterFunction,
  ItemClickHandler,
  PostRequestHandler,
  RequestErrorHandler,
  ExportHandler,
} from '@core/types';

interface Props {
  entity: string;
  customFields?: Record<string, CustomFieldConfig>;
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
  postRequest?: PostRequestHandler;
  onRequestError?: RequestErrorHandler;
  manual?: boolean;
  directQuery?: boolean;
  debounce?: number;
  limit?: number;
  allowedCollectionTypes?: CollectionType[];
  displayCount?: boolean;
  filterEditingLocation?: FilterEditingLocation;
  fieldsEditingLocation?: FieldsEditingLocation;
  sortEditingLocation?: SortEditingLocation;
  naturalSortWhenEmpty?: boolean;
  reflow?: boolean;
  onItemClick?: ItemClickHandler;
  onExport?: ExportHandler;
  aliasInsensitiveLabels?: boolean;
}

const filter = defineModel<Filter | null>('filter', { default: null });
const fields = defineModel<string[]>('fields', { required: true });
const sort = defineModel<(string | SortItemField)[]>('sort');
const page = defineModel<number>('page', { default: 1 });

// undefined: prevent Vue from casting absent boolean props to false
const props = withDefaults(defineProps<Props>(), {
  allowReset: undefined,
  allowUndo: undefined,
  allowRedo: undefined,
  displayOperator: undefined,
  manual: undefined,
  directQuery: undefined,
  displayCount: undefined,
  naturalSortWhenEmpty: undefined,
  reflow: undefined,
  aliasInsensitiveLabels: undefined,
});

const uniqueId = getUniqueId();
const queryBuilderId = 'qkit-query-builder-' + uniqueId;
const collectionId = 'qkit-collection-' + uniqueId;
const collectionRef = useTemplateRef<{ submit: () => void }>('collection');

const filterLocation = computed(() => props.filterEditingLocation ?? globalConfig.filterEditingLocation);
const fieldsLocation = computed(() => props.fieldsEditingLocation ?? globalConfig.fieldsEditingLocation);
const sortLocation = computed(() => props.sortEditingLocation ?? globalConfig.sortEditingLocation);
const showQueryBuilder = computed(
  () =>
    filterLocation.value === 'query-builder' ||
    fieldsLocation.value === 'query-builder' ||
    sortLocation.value === 'query-builder',
);

function onValidate(): void {
  collectionRef.value?.submit();
  document.getElementById(collectionId)?.scrollIntoView();
}
</script>

<template>
  <div :class="classes.search">
    <QueryBuilder
      v-if="showQueryBuilder"
      :id="queryBuilderId"
      v-model:filter="filter"
      v-model:fields="fields"
      v-model:sort="sort"
      :entity="entity"
      :custom-fields="customFields"
      :edit-filter="filterLocation === 'query-builder'"
      :edit-fields="fieldsLocation === 'query-builder'"
      :edit-sort="sortLocation === 'query-builder'"
      :allow-reset="allowReset"
      :allow-undo="allowUndo"
      :allow-redo="allowRedo"
      :allowed-scopes="allowedScopes"
      :allowed-properties="allowedProperties"
      :allowed-operators="allowedOperators"
      :display-operator="displayOperator"
      :user-timezone="userTimezone"
      :request-timezone="requestTimezone"
      :alias-insensitive-labels="aliasInsensitiveLabels"
      :manual="manual"
      :collection-id="collectionId"
      @validate="onValidate"
    />
    <Collection
      ref="collection"
      :id="collectionId"
      v-model:fields="fields"
      v-model:sort="sort"
      v-model:page="page"
      :entity="entity"
      :custom-fields="customFields"
      :filter="filter"
      :manual="manual"
      :debounce="debounce"
      :direct-query="directQuery"
      :limit="limit"
      :on-item-click="onItemClick"
      :post-request="postRequest"
      :on-request-error="onRequestError"
      :allowed-collection-types="allowedCollectionTypes"
      :display-count="displayCount"
      :on-export="onExport"
      :user-timezone="userTimezone"
      :request-timezone="requestTimezone"
      :edit-fields="fieldsLocation === 'collection'"
      :sort-editing-location="sortLocation === 'query-builder' ? 'none' : sortLocation"
      :natural-sort-when-empty="naturalSortWhenEmpty"
      :reflow="reflow"
      :requester="requester"
      :query-builder-id="showQueryBuilder ? queryBuilderId : undefined"
    />
  </div>
</template>
