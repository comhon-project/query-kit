<script setup>
import { ref, shallowRef, toRaw, watchEffect } from 'vue';
import Collection from './Collection/Collection.vue';
import FilterBuilder from './Filter/Builder.vue';
import { resolve } from '../core/Schema';
import IconButton from './Common/IconButton.vue';
import { classes } from '../core/ClassManager';
import Utils from '../core/Utils';

const emit = defineEmits(['rowClick']);
const props = defineProps({
  model: {
    type: String,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
  },
  filter: {
    type: Object,
    default: null,
  },
  allowReset: {
    type: Boolean,
    default: true,
  },
  computedScopes: {
    type: Object, // {modelname: [{id: 'scope_one', name: 'scope one', type: 'string', useOperator: true, computed: () => {...})}, ...], ...}
  },
  allowedScopes: {
    type: Object, // {modelname: ['scope_one', 'scope_two', ...], ...}
  },
  allowedProperties: {
    type: Object, // {modelname: ['property_name_one', 'property_name_two', ...], ...}
  },
  allowedOperators: {
    type: Object, // {condition: ['=', '<>', ...], group: ['AND', 'OR'], relationship_condition: ['HAS', 'HAS_NOT']}
  },
  displayOperator: {
    type: [Boolean, Object],
    default: true,
  },
  computedFilters: {
    type: Array,
    default: [],
  },
  userTimezone: {
    type: String,
    default: 'UTC',
  },
  requestTimezone: {
    type: String,
    default: 'UTC',
  },
  requester: {
    type: [Object, Function],
    validator(value) {
      return typeof value == 'function' || (typeof value == 'object' && typeof value.request == 'function');
    },
  },
  manually: {
    type: Boolean,
    default: true,
  },
  directQuery: {
    type: Boolean,
    default: true,
  },
  deferred: {
    type: Number,
    default: 1000,
  },
  limit: {
    type: Number,
    required: true,
  },
  offset: {
    type: Number,
    default: 0,
  },
  onRowClick: {
    type: Function,
  },
  quickSort: {
    type: Boolean,
    default: true,
  },
  postRequest: {
    type: Function,
  },
  allowedCollectionTypes: {
    type: Array,
    default: ['pagination'],
  },
  displayCount: {
    type: Boolean,
  },
  onExport: {
    type: Function,
  },
});

let tempFilter = null;
const uniqueId = Utils.getUniqueId();
const filterId = 'qkit-filter-' + uniqueId;
const collectionId = 'qkit-collection-' + uniqueId;
const schema = ref();
const builtFilter = ref(null);
const computedFilter = shallowRef(false);

async function initSchema() {
  schema.value = await resolve(props.model);
}

function getInitialFilter() {
  if (
    !props.filter &&
    props.allowedOperators &&
    props.allowedOperators['group'] &&
    (!Array.isArray(props.allowedOperators['group']) ||
      (!props.allowedOperators['group'].includes('and') && !props.allowedOperators['group'].includes('or')))
  ) {
    throw new Error('invalid allowed operators, must be array that contain at least "and" or "or" values');
  }
  const initialFilter = props.filter
    ? structuredClone(toRaw(props.filter))
    : {
        type: 'group',
        filters: [],
        operator:
          props.allowedOperators && props.allowedOperators['group'] ? props.allowedOperators['group'][0] : 'and',
      };
  initialFilter.removable = false;

  return initialFilter;
}

async function applyQuery() {
  // we copy object filter if it didn't changed to force reload collection
  computedFilter.value = computedFilter.value === tempFilter ? Object.assign({}, tempFilter) : tempFilter;
  location.href = `#${collectionId}`;
}

function updateFilter(filter) {
  tempFilter = filter;

  // if computedFilter.value === false, this is the initialization of the computed filter
  // (there are no user interaction yet)
  if (!props.manually || computedFilter.value === false) {
    computedFilter.value = filter;
  }
}

function goToCollection() {
  location.href = `#${collectionId}`;
  document.getElementById(collectionId).focus();
}

function goToFilter() {
  location.href = `#${filterId}`;
  document.getElementById(filterId).focus();
}

watchEffect(() => {
  initSchema();
  builtFilter.value = getInitialFilter();
});
</script>

<template>
  <div v-if="schema" :class="classes.search">
    <FilterBuilder
      v-bind="props"
      v-model="builtFilter"
      @computed="updateFilter"
      :id="filterId"
      :display-shortcuts="true"
      @go-to-collection="goToCollection"
    >
      <template #validate>
        <IconButton v-if="manually" icon="search" @click="applyQuery" />
      </template>
    </FilterBuilder>
    <Collection
      v-if="computedFilter !== false"
      v-bind="props"
      :filter="computedFilter"
      :id="collectionId"
      :display-shortcuts="true"
      @go-to-filter="goToFilter"
    >
      <template #loading="loadingProps">
        <slot name="loading" v-bind="loadingProps"></slot>
      </template>
    </Collection>
  </div>
</template>
