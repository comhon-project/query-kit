<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { classes } from '@core/ClassManager';
import IconButton from '@components/Common/IconButton.vue';
import { usePropertyPath } from '@components/Filter/Composable/PropertyPath';
import { resolve, getPropertyTranslation, type EntitySchema, type Property } from '@core/EntitySchema';

interface Props {
  entitySchema: EntitySchema;
  columns: string[];
  propertyId?: string;
  label?: string | ((locale: string) => string);
}

interface Emits {
  remove: [];
}

const emit = defineEmits<Emits>();
const columnId = defineModel<string>({ required: true });
const props = defineProps<Props>();

const { label, propertyPath } = usePropertyPath(props);
const schema = ref<EntitySchema | null>(null);
const editing = ref<boolean>(false);
const selectedProperty = ref<string | null>(null);
const expandable = computed<boolean>(() => {
  if (!propertyPath.value) return false;
  const property = propertyPath.value[propertyPath.value.length - 1];
  return property?.type == 'relationship' && isOneToOneRelationship(property);
});

const options = computed<Property[] | null>(() => {
  if (!editing.value || !schema.value) {
    return null;
  }
  const opts: Property[] = [];
  for (const property of schema.value.properties) {
    if (property.type != 'relationship') {
      if (!props.columns.includes(props.propertyId + '.' + property.id)) {
        opts.push(property);
      }
    } else if (isOneToOneRelationship(property)) {
      opts.push(property);
    }
  }

  return opts;
});

function isOneToOneRelationship(property: Property): boolean {
  return property.relationship_type == 'belongs_to' || property.relationship_type == 'has_one';
}

function expandProperty(): void {
  editing.value = true;
}

function reduceProperty(): void {
  if (editing.value) {
    editing.value = false;
  } else if (props.propertyId && propertyPath.value) {
    const end = -propertyPath.value[propertyPath.value.length - 1].id.length - 1;
    columnId.value = props.propertyId.slice(0, end);
  }
}

function remove(): void {
  emit('remove');
}

watch(propertyPath, async () => {
  if (!propertyPath.value || !propertyPath.value.length) return;
  const schemaId = propertyPath.value[propertyPath.value.length - 1].related;
  if (schemaId) {
    schema.value = await resolve(schemaId);
  }
});
watch(selectedProperty, () => {
  if (selectedProperty.value) {
    columnId.value = props.propertyId + '.' + selectedProperty.value;
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
        <option v-for="property in options" :key="property.id" :value="property.id">
          {{ getPropertyTranslation(property) }}
        </option>
      </select>
      <IconButton v-else icon="add" @click="expandProperty" />
    </template>
    <IconButton
      v-if="(propertyPath && propertyPath.length > 1) || editing"
      icon="minus"
      label="remove"
      @click="reduceProperty"
    />
    <IconButton icon="delete" @click="remove" />
  </div>
</template>
