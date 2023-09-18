<script setup>
import { computed, ref, watch } from 'vue';
import { classes } from '../../core/ClassManager';
import IconButton from '../Common/IconButton.vue';
import { usePropertyPath } from '../Filter/Composable/PropertyPath';
import { resolve } from '../../core/Schema';

const emit = defineEmits(['remove', 'update:columnId']);
const props = defineProps({
  model: {
    type: String,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
  },
  columnId: {
    type: String,
    required: true,
  },
  propertyId: {
    type: String,
    default: undefined,
  },
  label: {
    type: [String, Function],
    default: undefined,
  },
});

const { label, propertyPath } = usePropertyPath(props);
const schema = ref(false);
const editing = ref(false);
const selectedProperty = ref(null);
const expandable = computed(() => {
  const property = propertyPath.value?.[propertyPath.value.length - 1];
  return property?.type == 'relationship' && isOneToOneRelationship(property);
});
const options = computed(() => {
  if (!editing.value) {
    return null;
  }
  const options = [];
  for (const property of schema.value.properties) {
    if (property.type != 'relationship') {
      const column = props.columns.find((column) => {
        return props.propertyId + '.' + property.id == column.id;
      });
      if (!column) {
        options.push(property);
      }
    } else if (isOneToOneRelationship(property)) {
      options.push(property);
    }
  }

  return options;
});

function isOneToOneRelationship(property) {
  return property.relationship_type == 'belongs_to' || property.relationship_type == 'has_one';
}

function expandProperty() {
  editing.value = true;
}

function reduceProperty() {
  if (editing.value) {
    editing.value = false;
  } else {
    const end = -propertyPath.value[propertyPath.value.length - 1].id.length - 1;
    emit('update:columnId', props.propertyId.slice(0, end));
  }
}

function remove() {
  emit('remove');
}

watch(propertyPath, async () => {
  const model = propertyPath.value?.[propertyPath.value.length - 1].model;
  if (model) {
    schema.value = await resolve(model);
  }
});
watch(selectedProperty, () => {
  if (selectedProperty.value) {
    emit('update:columnId', props.propertyId + '.' + selectedProperty.value);
    selectedProperty.value = null;
    editing.value = false;
  }
});
</script>

<template>
  <div :class="classes.column_choice">
    <span>{{ label }}</span>
    <template v-if="expandable && schema">
      <select v-if="editing" v-model="selectedProperty" :class="classes.input">
        <option value="" disabled hidden />
        <option v-for="property in options" :key="property" :value="property.id">
          {{ property.name }}
        </option>
      </select>
      <IconButton v-else icon="add" @click="expandProperty" />
    </template>
    <IconButton v-if="propertyPath.length > 1 || editing" icon="minus" label="remove" @click="reduceProperty" />
    <IconButton icon="delete" @click="remove" />
  </div>
</template>
