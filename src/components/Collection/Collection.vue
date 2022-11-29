<script setup>
import { computed, ref, watch, onMounted, toRaw } from 'vue'
import SchemaLoader from '../../core/SchemaLoader.js'

const map = {
  string: 'text',
};

const props = defineProps({
  values: {
    type: Array,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  properties: {
    type: Array,
    required: true
  },
});

const schema = ref(null);
const computedProperties = ref([]);

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

onMounted(() => {
   init(true);
});
watch(() => props.model, () => init(true));
watch(() => props.properties, () => init(false));

</script>

<template>
  <table>
    <thead>
      <tr>
        <th style="border: 1px solid blue" v-for="computedProperty in computedProperties" :key="computedProperty.id">
          {{ computedProperty.label  }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="object in values" :key="object.id">
        <td v-for="computedProperty in computedProperties" :key="computedProperty.id">
          {{ object[computedProperty.id] }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>

</style>