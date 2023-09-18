<script setup>
import { ref, shallowRef, toRaw, watch, watchEffect } from 'vue';
import Collection from './Collection/Collection.vue';
import FilterBuilder from './Filter/Builder.vue';
import { resolve } from '../core/Schema';
import IconButton from './Common/IconButton.vue';
import { classes } from '../core/ClassManager';
import Utils from '../core/Utils';
import Shortcuts from './Filter/Shortcuts.vue';
import { getContainerOperators } from '../core/OperatorManager';

const emit = defineEmits(['rowClick', 'export', 'computed', 'updated', 'update:columns']);
const props = defineProps({
  model: {
    type: String,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
  },
  customColumns: {
    type: Object,
    default: undefined,
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
  displayOperator: {
    type: [Boolean, Object],
    default: true,
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
    default: undefined,
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
    default: undefined,
  },
  quickSort: {
    type: Boolean,
    default: true,
  },
  postRequest: {
    type: Function,
    default: undefined,
  },
  allowedCollectionTypes: {
    type: Array,
    default() {
      return ['pagination'];
    },
  },
  displayCount: {
    type: Boolean,
  },
  editColumns: {
    type: Boolean,
  },
  onExport: {
    type: Function,
    default: undefined,
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
  const initialFilter = props.filter
    ? structuredClone(toRaw(props.filter))
    : {
        type: 'group',
        filters: [],
        operator: getContainerOperators('group', props.allowedOperators)?.[0] || 'and',
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
watch(computedFilter, () => {
  emit('updated', structuredClone(toRaw(builtFilter.value)));
  emit('computed', structuredClone(toRaw(computedFilter.value)));
});
</script>

<template>
  <div v-if="schema" :class="classes.search">
    <FilterBuilder v-bind="props" :id="filterId" v-model="builtFilter" @computed="updateFilter">
      <template #validate>
        <IconButton v-if="manually" icon="search" @click="applyQuery" />
      </template>
      <template #shortcuts>
        <Shortcuts @go-to-collection="goToCollection" />
      </template>
    </FilterBuilder>
    <Collection
      v-if="computedFilter !== false"
      v-bind="props"
      :id="collectionId"
      :filter="computedFilter"
      @update:columns="(columns) => emit('update:columns', columns)"
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
