<script setup>
import { ref, watch, onMounted, toRaw, watchEffect } from 'vue'
import { classes } from '../../core/ClassManager';
import SchemaLoader from '../../core/SchemaLoader';

const map = {
  string: 'text',
};

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
});

const schema = ref(null);
const computedProperties = ref([]);
const collection = ref([]);

async function init() {
  schema.value = await SchemaLoader.getComputedSchema(props.model);
  const tempProperties = [];

  for(const property of props.properties) {
    if (typeof property == 'object') {
      tempProperties.push(toRaw(property));
    } else if (typeof property == 'string') {
      const splited = property.split('.');
      let currentSchema = schema.value;
      for (let i = 0; i < splited.length - 1; i++) {
        currentSchema = await SchemaLoader.getComputedSchema(currentSchema.mapProperties[splited[i]].model);
      }
      tempProperties.push({
        id: property,
        label: currentSchema.mapProperties[splited[splited.length - 1]].name
      });
    }
  }

  computedProperties.value = tempProperties;
}



async function applyQuery()
{
  const res = {
    count: 10,
    collection: [
      {id: 10, first_name: 'john '+Math.random().toString(36), 'last_name': 'doe'},
      {id: 11, first_name: 'jane', 'last_name': 'doe'},
      {id: 12, first_name: 'adam', 'last_name': 'smith'},
    ]
  }
  collection.value = res.collection;
}

onMounted(async () => {
   await init(true);
   if (props.directQuery) {
    applyQuery();
  }
});
watch(() => props.model, () => init(true));
watch(() => props.properties, () => init(false));
watch(() => props.filter, applyQuery);

</script>

<template>
  <table :class="classes.collection_table">
    <thead>
      <tr>
        <th v-for="computedProperty in computedProperties" :key="computedProperty.id">
          {{ computedProperty.label  }}
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
</template>