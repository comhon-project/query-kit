<script setup lang="ts">
import { computed, ref, onUnmounted, watchEffect, toRef } from 'vue';
import IconButton from '@components/Common/IconButton.vue';
import SortListItem from '@components/Collection/SortListItem.vue';
import { translate } from '@i18n/i18n';
import { classes } from '@core/ClassManager';
import { isPropertySortable, type EntitySchema } from '@core/EntitySchema';
import { getSortableProperties } from '@core/RequestSchema';
import { useDragAndDrop } from '@core/useDragAndDrop';
import { useColumnLabels } from '@components/Composable/ColumnLabels';
import { useInternalModel } from '@components/Composable/InternalModel';
import type { History } from '@components/Composable/History';
import { getUniqueId } from '@core/Utils';
import type { CustomFieldConfig, SelectOption, SortItemField } from '@core/types';

interface KeyedSort {
  field: string;
  order: 'asc' | 'desc';
  key: string | number;
}

interface Props {
  entitySchema: EntitySchema;
  fields?: string[]; // the picker is scoped to these fields
  customFields?: Record<string, CustomFieldConfig>;
  history?: History;
}

const sort = defineModel<(string | SortItemField)[]>({ required: true });
const props = defineProps<Props>();

const { liveMessage, onGripStart, setItemRef, getItemBindings, getDropZoneBindings } = useDragAndDrop({ move });

const selectedField = ref<string | null>(null);
const sortableFields = ref<string[]>([]);
const internalModel = useInternalModel<(string | SortItemField)[], KeyedSort[]>(sort, {
  normalize: (items) =>
    items.map((item) =>
      typeof item === 'string'
        ? { field: item, order: 'asc', key: getUniqueId() }
        : { field: item.field, order: item.order || 'asc', key: getUniqueId() },
    ),
  strip: (keyed) => keyed.map((k) => ({ field: k.field, order: k.order })),
  onInbound: () => props.history?.rebaseline('sort'),
});
const optionLabels = useColumnLabels(toRef(props, 'entitySchema'), sortableFields, toRef(props, 'customFields'));

const options = computed<SelectOption<string>[]>(() =>
  sortableFields.value
    .filter((field) => !internalModel.value.some((s) => s.field === field))
    .map((field) => ({ value: field, label: optionLabels.value[field] ?? field })),
);

function removeSort(index: number): void {
  internalModel.value.splice(index, 1);
}

function addSort(): void {
  if (selectedField.value) {
    internalModel.value.push({ field: selectedField.value, order: 'asc', key: getUniqueId() });
    selectedField.value = null;
  }
}

function move(from: number, to: number): void {
  const item = internalModel.value.splice(from, 1)[0];
  internalModel.value.splice(to, 0, item);
}

props.history?.register('sort', internalModel);
onUnmounted(() => props.history?.unregister('sort'));

watchEffect(async (onCleanup) => {
  let stale = false;
  onCleanup(() => (stale = true));
  const entityId = props.entitySchema.id;
  const fields = props.fields;
  const customFields = props.customFields;
  let result: string[];
  if (fields) {
    const results = await Promise.all(
      fields.map(async (field) => {
        if (customFields?.[field]?.sort) return field;
        if (customFields?.[field]?.open) return null;
        return (await isPropertySortable(entityId, field)) ? field : null;
      }),
    );
    result = results.filter((field): field is string => field !== null);
  } else {
    const base = await getSortableProperties(entityId).catch(() => [] as string[]);
    const customSortable = Object.keys(customFields ?? {}).filter((id) => customFields![id].sort);
    result = [...base, ...customSortable];
  }
  if (!stale) sortableFields.value = result;
});
</script>

<template>
  <div :class="classes.sr_only" aria-live="assertive" aria-atomic="true">{{ liveMessage }}</div>
  <ul :class="classes.field_editor_list" :aria-label="translate('sort')">
    <TransitionGroup name="qkit-collapse-horizontal-list">
      <li
        v-for="(item, index) in internalModel"
        :ref="(el: any) => setItemRef(el, index)"
        :key="item.key"
        :class="classes.field_editor_list_item"
        v-bind="getItemBindings(index)"
      >
        <SortListItem
          v-model:field="internalModel[index].field"
          v-model:order="internalModel[index].order"
          :open="customFields?.[item.field]?.open === true"
          :fixed-path="fields != null"
          :label="customFields?.[item.field]?.label"
          :entity-schema="entitySchema"
          @remove="() => removeSort(index)"
          @grip-start="onGripStart"
        />
      </li>
    </TransitionGroup>
    <div :class="classes.field_picker" v-bind="getDropZoneBindings()">
      <select v-if="options.length" v-model="selectedField" :class="classes.input">
        <option value="" disabled hidden />
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <IconButton icon="add" :disabled="!options.length" @click="addSort" />
    </div>
  </ul>
</template>
