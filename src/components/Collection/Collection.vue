<script setup>
import { ref, watch, onMounted, toRaw, watchEffect, inject } from 'vue'
import { classes } from '../../core/ClassManager';
import SchemaLoader from '../../core/SchemaLoader';
import Utils from '../../core/Utils';

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
});

let movingOffset = props.offset;
const requesting = ref(false);
const requester = inject(Symbol.for('requester'));
const schema = ref(null);
const computedProperties = ref([]);
const collection = ref([]);
const end = ref(false);

const observered = ref(null);
let observer;

async function init() {
  schema.value = await SchemaLoader.getComputedSchema(props.model);
  if (!schema.value) {
    throw new Error(`invalid model "${props.model}"`);
  }
  const tempProperties = [];

  for(const property of props.properties) {
    let computedProperty = typeof property == 'object'
        ? (property.label == null ? Object.assign({}, property) : property)
        : {id: property};
    if (computedProperty.label == null) {
      const splited = computedProperty.id.split('.');
      let currentSchema = schema.value;
      for (let i = 0; i < splited.length - 1; i++) {
        if (!currentSchema.mapProperties[splited[i]]) {
          throw new Error(`invalid collection property "${computedProperty.id}"`);
        }
        currentSchema = await SchemaLoader.getComputedSchema(currentSchema.mapProperties[splited[i]].model);
        if (!currentSchema) {
          throw new Error(`invalid model "${currentSchema.mapProperties[splited[i]].model}"`);
        }
      }
      if (!currentSchema.mapProperties[splited[splited.length - 1]]) {
        throw new Error(`invalid collection property "${computedProperty.id}"`);
      }
      computedProperty.label = currentSchema.mapProperties[splited[splited.length - 1]].name
    }
    tempProperties.push(computedProperty);
  }

  computedProperties.value = tempProperties;
}

async function shiftThenRequestServer()
{
  if (!requesting.value) {
    movingOffset += props.limit;
    requestServer();
  }
}

async function requestServer()
{
  requesting.value = true;
  const response = await requester.request({
    offset: movingOffset,
    limit: props.limit,
    filter: props.filter,
    properties: computedProperties.value.map(property => property.id),
  });
  if ((typeof response != 'object') || !Array.isArray(response.collection)) {
    throw new Error('invalid request response, it must be an object containing a property "collection" with an array value');
  }
  for (const element of response.collection) {
    collection.value.push(element);
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
watch(() => props.filter, requestServer);

</script>

<template>
  <div :class="classes.collection" :id="id">
    <table :class="classes.collection_table">
      <thead>
        <tr>
          <th v-for="computedProperty in computedProperties" :key="computedProperty.id">
            {{ computedProperty.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="object in collection" :key="object.id">
          <td v-for="computedProperty in computedProperties" :key="computedProperty.id">
            {{ object[computedProperty.id] }}
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="!end" ref="observered" style="height: 5px;"></div>
    <div v-show="requesting" style="position: relative;">
      <slot name="loading"></slot>
    </div>
  </div>
</template>