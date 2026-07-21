<script setup lang="ts">
import { computed, ref, shallowRef, watch, watchEffect } from 'vue';
import { classes } from '@core/ClassManager';
import IconButton from '@components/Common/IconButton.vue';
import FieldLabel from '@components/Collection/FieldLabel.vue';
import { getPropertyPath, resolve, getPropertyTranslation, type EntitySchema, type Property } from '@core/EntitySchema';
import { getSortableProperties } from '@core/RequestSchema';

interface Props {
  entitySchema: EntitySchema;
  fields?: string[];
  sortableOnly?: boolean;
  labelId?: string;
  label?: string | ((locale: string) => string);
}

const propertyPath = defineModel<string>({ required: true });
const props = defineProps<Props>();

const resolvedPath = shallowRef<Property[] | false>([]);
const lastRelatedSchema = ref<EntitySchema | null>(null);
const sortableChildren = ref<string[]>([]);
const editing = ref<boolean>(false);
const selectedProperty = ref<string | null>(null);

const tailProperty = computed<Property | null>(() =>
  resolvedPath.value && resolvedPath.value.length ? resolvedPath.value[resolvedPath.value.length - 1] : null,
);
const expandable = computed<boolean>(() => {
  const property = tailProperty.value;
  if (!property) return false;
  const drillable = property.type === 'object' || (property.type === 'relationship' && isOneToOneRelationship(property));
  if (!drillable) return false;
  return props.sortableOnly ? sortableChildren.value.length > 0 : true;
});
const options = computed<Property[] | null>(() => {
  if (!editing.value || !lastRelatedSchema.value) return null;
  if (props.sortableOnly) {
    return lastRelatedSchema.value.properties.filter((property) => sortableChildren.value.includes(property.id));
  }
  const opts: Property[] = [];
  for (const property of lastRelatedSchema.value.properties) {
    if (property.type === 'object') {
      opts.push(property);
    } else if (property.type === 'relationship') {
      if (isOneToOneRelationship(property)) {
        opts.push(property);
      }
    } else if (!(props.fields ?? []).includes(propertyPath.value + '.' + property.id)) {
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

watch(selectedProperty, () => {
  if (selectedProperty.value) {
    propertyPath.value = propertyPath.value + '.' + selectedProperty.value;
    selectedProperty.value = null;
    editing.value = false;
  }
});
watchEffect(async (onCleanup) => {
  let stale = false;
  onCleanup(() => (stale = true));
  try {
    const path = await getPropertyPath(props.entitySchema.id, propertyPath.value);
    if (!stale) resolvedPath.value = path;
  } catch {
    if (!stale) resolvedPath.value = false;
  }
});
watchEffect(async (onCleanup) => {
  let stale = false;
  onCleanup(() => (stale = true));
  const entity = tailProperty.value?.entity;
  if (!entity) {
    sortableChildren.value = [];
    lastRelatedSchema.value = null;
    return;
  }
  const [schema, sortable] = await Promise.all([
    resolve(entity).catch(() => null),
    props.sortableOnly ? getSortableProperties(entity).catch(() => [] as string[]) : Promise.resolve([] as string[]),
  ]);
  if (!stale) {
    lastRelatedSchema.value = schema;
    sortableChildren.value = sortable;
  }
});
</script>

<template>
  <FieldLabel :id="labelId" :entity-schema="entitySchema" :field-id="propertyPath" :label="label" />
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
