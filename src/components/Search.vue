<script setup>
import { ref, toRaw, watchEffect } from 'vue'
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
  deferred: {
    type: Number,
    default: 1000
  },
});

const schema = ref();
const builtFilter = ref(null);
const computedFilter = ref(null);
const collection = ref([]);
const count = ref(0);

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

async function search()
{
  const res = {
    count: 10,
    collection: [
      {id: 10, first_name: 'john', 'last_name': 'doe'},
      {id: 11, first_name: 'jane', 'last_name': 'doe'},
      {id: 12, first_name: 'adam', 'last_name': 'smith'},
    ]
  }
  collection.value = res.collection;
  location.href = "#search-result"
}

watchEffect(() => {
  initSchema();
  builtFilter.value = getInitialFilter();
});

</script>

<template>
  <div v-if="schema">
    <FilterBuilder v-bind="props" v-model="builtFilter" @computed="(filter) => computedFilter = filter">
      <template #validate>
          <div><IconButton icon="search" @click="search" /></div>
        </template>
    </FilterBuilder>
    <div id="search-result">
      <Collection v-bind="props" :values="collection"/>
    </div>
    <pre wrap>{{ JSON.stringify(builtFilter) }}</pre>
    ---------------------------------------------
    <pre wrap>{{ JSON.stringify(computedFilter) }}</pre>
  </div>
</template>