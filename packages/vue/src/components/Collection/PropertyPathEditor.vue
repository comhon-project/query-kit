<script setup lang="ts">
import { computed, ref, shallowRef, watch, watchEffect } from 'vue';
import { classes } from '@core/ClassManager';
import IconButton from '@components/Common/IconButton.vue';
import ColumnName from '@components/Collection/ColumnName.vue';
import { getPropertyPath, resolve, getPropertyTranslation, type EntitySchema, type Property } from '@core/EntitySchema';

interface Props {
  entitySchema: EntitySchema;
  columns: string[];
  label?: string | ((locale: string) => string);
}

const props = defineProps<Props>();
const propertyPath = defineModel<string>({ required: true });

const resolvedPath = shallowRef<Property[] | false>([]);
const lastRelatedSchema = ref<EntitySchema | null>(null);
const editing = ref<boolean>(false);
const selectedProperty = ref<string | null>(null);
const expandable = computed<boolean>(() => {
  if (!resolvedPath.value) return false;
  const property = resolvedPath.value[resolvedPath.value.length - 1];
  return property?.type == 'relationship' && isOneToOneRelationship(property);
});

const options = computed<Property[] | null>(() => {
  if (!editing.value || !lastRelatedSchema.value) {
    return null;
  }
  const opts: Property[] = [];
  for (const property of lastRelatedSchema.value.properties) {
    if (property.type != 'relationship') {
      if (!props.columns.includes(propertyPath.value + '.' + property.id)) {
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
  } else if (resolvedPath.value) {
    const end = -resolvedPath.value[resolvedPath.value.length - 1].id.length - 1;
    propertyPath.value = propertyPath.value.slice(0, end);
  }
}

watch(resolvedPath, async () => {
  if (!resolvedPath.value || !resolvedPath.value.length) return;
  const lastRelatedSchemaId = resolvedPath.value[resolvedPath.value.length - 1].related;
  if (lastRelatedSchemaId) {
    lastRelatedSchema.value = await resolve(lastRelatedSchemaId);
  }
});
watch(selectedProperty, () => {
  if (selectedProperty.value) {
    propertyPath.value = propertyPath.value + '.' + selectedProperty.value;
    selectedProperty.value = null;
    editing.value = false;
  }
});
watchEffect(async () => {
  try {
    resolvedPath.value = await getPropertyPath(props.entitySchema.id, propertyPath.value);
  } catch {
    resolvedPath.value = false;
  }
});
</script>

<template>
  <ColumnName :entity-schema="entitySchema" :column-id="propertyPath" :label="label" />
  <template v-if="expandable && lastRelatedSchema">
    <select v-if="editing" v-model="selectedProperty" :class="classes.input">
      <option value="" disabled hidden />
      <option v-for="property in options" :key="property.id" :value="property.id">
        {{ getPropertyTranslation(property) }}
      </option>
    </select>
    <IconButton v-else icon="add" @click="expandProperty" />
  </template>
  <IconButton
    v-if="(resolvedPath && resolvedPath.length > 1) || editing"
    icon="minus"
    label="remove"
    @click="reduceProperty"
  />
</template>
