<script setup>
import { ref, shallowRef, toRaw, watchEffect } from 'vue'
import Collection from './Collection/Collection.vue';
import FilterBuilder from './Filter/Builder.vue';
import cloneDeep from 'lodash.clonedeep';
import SchemaLoader from '../core/SchemaLoader';
import IconButton from './Common/IconButton.vue';

const props = defineProps({
  model: {
    type: String,
    required: true
  },
  properties: {
    type: Array,
    required: true
  },
  filter: {
    type: Object,
    default: null
  },
  allowReset: {
    type: Boolean,
    default: true
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
    default: true
  },
  computedFilters: {
    type: Array,
    default: [],
  },
  userTimezone: {
    type: String,
    default: 'UTC'
  },
  requestTimezone: {
    type: String,
    default: 'UTC'
  },
  manually: {
    type: Boolean,
    default: true
  },
  directQuery: {
    type: Boolean,
    default: true
  },
  deferred: {
    type: Number,
    default: 1000
  },
});

let tempFilter = null;
const schema = ref();
const builtFilter = ref(null);
const computedFilter = shallowRef(false);

async function initSchema()
{
  schema.value = await SchemaLoader.getComputedSchema(props.model);
}

function getInitialFilter()
{
  if (
    !props.filter 
    && props.allowedOperators 
    && props.allowedOperators['group'] 
    && (
      !Array.isArray(props.allowedOperators['group'])
      || (!props.allowedOperators['group'].includes('and') && !props.allowedOperators['group'].includes('or'))
    )
  ) {
    throw new Error('invalid allowed operators, must be array that contain at least "and" or "or" values');
  }
  const initialFilter = props.filter ? cloneDeep(toRaw(props.filter)) : {
    type: 'group', 
    filters: [], 
    operator: props.allowedOperators && props.allowedOperators['group'] 
      ? props.allowedOperators['group'][0]
      : 'and'
  };
  initialFilter.removable = false;

  return initialFilter;
}

async function applyQuery()
{
  // we copy object filter if it didn't changed to force reload collection
  computedFilter.value = computedFilter.value === tempFilter ? Object.assign({}, tempFilter) : tempFilter;
  location.href = "#query-collection";
}

function updateFilter(filter)
{
  tempFilter = filter;

  // if computedFilter.value === false, this is the initialization of the computed filter
  // (there are no user interaction yet)
  if (!props.manually || computedFilter.value === false) {
    computedFilter.value = filter;
  }
}

watchEffect(() => {
  initSchema();
  builtFilter.value = getInitialFilter();
});

</script>

<template>
  <div v-if="schema">
    <FilterBuilder v-bind="props" v-model="builtFilter" @computed="updateFilter">
      <template #validate>
          <IconButton v-if="manually" icon="search" @click="applyQuery" />
        </template>
    </FilterBuilder>
    <div id="query-collection">
      <Collection v-if="computedFilter !== false" v-bind="props" :filter="computedFilter"/>
    </div>
    <pre wrap>{{ JSON.stringify(builtFilter) }}</pre>
    ---------------------------------------------
    <pre wrap>{{ JSON.stringify(computedFilter) }}</pre>
  </div>
</template>