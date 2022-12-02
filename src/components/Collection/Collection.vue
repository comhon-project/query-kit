<script setup>
import { ref, watch, onMounted, toRaw, watchEffect, inject, shallowRef } from 'vue'
import { classes } from '../../core/ClassManager';
import { resolve } from '../../core/Schema';
import Utils from '../../core/Utils';

const emit = defineEmits(['rowClick']);
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
  },
  directQuery: {
    type: Boolean,
    required: true
  },
  limit: {
    type: Number,
    required: true
  },
  offset: {
    type: Number,
    default: 0
  },
  id: {
    type: String,
  },
  onRowClick: {
    type: Function,
  },
  quickSort: {
    type: Boolean,
    default: true
  },
});

let movingOffset = props.offset;
const requesting = ref(false);
const requester = inject(Symbol.for('requester'));
const schema = shallowRef(null);
const computedProperties = ref([]);
const collection = shallowRef([]);
const end = ref(false);
const active = ref(null);
const order = ref(null);

const observered = ref(null);
let observer;

async function init() {
  schema.value = await resolve(props.model);
  if (!schema.value) {
    throw new Error(`invalid model "${props.model}"`);
  }
  const tempProperties = [];

  for(const property of props.properties) {
    let computedProperty = typeof property == 'object'
        ? Object.assign({}, property)
        : {id: property};
    if (computedProperty.label == null) {
      computedProperty.label = await getLabel(computedProperty);
    }
    if (props.quickSort) {
      computedProperty.sortable = await isSortable(computedProperty);
      if (computedProperty.sortable && computedProperty.order && ['asc', 'desc'].includes(computedProperty.order.toLowerCase())) {
        active.value = computedProperty.id;
        order.value = computedProperty.order.toLowerCase();
      }
    }
    tempProperties.push(computedProperty);
  }
  computedProperties.value = tempProperties;
}

async function isSortable(computedProperty) {
  if (!schema.value.search || !Array.isArray(schema.value.search.sort)) {
    return false;
  }
  const splited = computedProperty.id.split('.');
  let currentSchema = schema.value;
  for (let i = 0; i < splited.length - 1; i++) {
    if (!currentSchema.mapProperties[splited[i]]) {
      throw new Error(`invalid collection property "${computedProperty.id}"`);
    }
    if (!currentSchema.search || !Array.isArray(currentSchema.search.sort) || !currentSchema.search.sort.includes(splited[i])) {
      return false;
    }
    currentSchema = await resolve(currentSchema.mapProperties[splited[i]].model);
    if (!currentSchema) {
      throw new Error(`invalid model "${currentSchema.mapProperties[splited[i]].model}"`);
    }
  }
  return currentSchema.search.sort.includes(splited[splited.length - 1]);
}

async function getLabel(computedProperty) {
  const splited = computedProperty.id.split('.');
  let currentSchema = schema.value;
  for (let i = 0; i < splited.length - 1; i++) {
    if (!currentSchema.mapProperties[splited[i]]) {
      throw new Error(`invalid collection property "${computedProperty.id}"`);
    }
    currentSchema = await resolve(currentSchema.mapProperties[splited[i]].model);
    if (!currentSchema) {
      throw new Error(`invalid model "${currentSchema.mapProperties[splited[i]].model}"`);
    }
  }
  if (!currentSchema.mapProperties[splited[splited.length - 1]]) {
    throw new Error(`invalid collection property "${computedProperty.id}"`);
  }
  return currentSchema.mapProperties[splited[splited.length - 1]].name
}

async function shiftThenRequestServer()
{
  if (!requesting.value) {
    movingOffset += props.limit;
    requestServer();
  }
}

async function requestServer(reset = false)
{
  if (reset) {
    end.value = false;
    movingOffset = 0;
  }
  requesting.value = true;
  const response = await requester.request({
    order: active.value ? [{property: active.value, order: order.value}] : undefined,
    offset: movingOffset,
    limit: props.limit,
    filter: props.filter,
    properties: computedProperties.value.map(property => property.id),
  });
  if ((typeof response != 'object') || !Array.isArray(response.collection)) {
    throw new Error('invalid request response, it must be an object containing a property "collection" with an array value');
  }
  if (reset) {
    collection.value = response.collection;
  } else {
    for (const element of response.collection) {
      collection.value.push(element);
    }
  }
  if (response.collection.length < props.limit) {
    end.value = true;
  }
  // observer is directly triggered when view is updated
  // so we wait 10 ms to avoid to request two times in a row
  setTimeout(() => {
    requesting.value = false;
  }, 10);
}

function updateOrder(property)
{
  if (!requesting.value) {
    order.value = active.value != property || order.value == 'desc' ? 'asc' : 'desc';
    active.value = property;
    requestServer(true);
  }
}

onMounted(async () => {
   await init(true);
   observer = new IntersectionObserver(shiftThenRequestServer, {
    threshold: 1.0
   });
   observer.observe(observered.value);
   if (props.directQuery) {
    requestServer();
  }
});
watch(() => props.model, () => init(true));
watch(() => props.properties, () => init(false));
watch(() => props.filter, () => requestServer(true));
</script>

<template>
  <div :class="classes.collection" :id="id">
    <table :class="classes.collection_table">
      <thead>
        <tr>
          <th v-for="computedProperty in computedProperties" :key="computedProperty.id">
            <div v-if="computedProperty.sortable"
              :class="classes.clickable + ' ' + (active == computedProperty.id ? (classes.active + ' ' + order) : '')" 
              @click="() => updateOrder(computedProperty.id)"
            >
              {{ computedProperty.label }}
            </div>
            <div v-else>
              {{ computedProperty.label }}
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="object in collection" :key="object.id" 
          :class="onRowClick ? classes.clickable : ''" 
          @click="(e) => $emit('rowClick', object, e)"
        >
          <td v-for="computedProperty in computedProperties" :key="computedProperty.id" 
            :class="computedProperty.onCellClick ? classes.clickable : ''" 
            @click="(e) => computedProperty.onCellClick ? computedProperty.onCellClick(object, computedProperty.id, e) : null"
          >
            {{ object[computedProperty.id] }}
          </td>
        </tr>
      </tbody>
    </table>
    <div v-show="!end" ref="observered" style="height: 1px;"></div>
    <div v-show="requesting" style="position: relative;">
      <slot name="loading"></slot>
    </div>
  </div>
</template>