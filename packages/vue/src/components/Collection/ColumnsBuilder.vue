<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import IconButton from '@components/Common/IconButton.vue';
import ColumnEditorItem from '@components/Collection/ColumnEditorItem.vue';
import { translate, locale } from '@i18n/i18n';
import { classes } from '@core/ClassManager';
import { getPropertyTranslation, type EntitySchema, type Property } from '@core/EntitySchema';
import { useDragAndDrop } from '@core/useDragAndDrop';
import { getUniqueId } from '@core/Utils';
import type { CustomColumnConfig, SelectOption } from '@core/types';

interface KeyedColumn {
  id: string;
  key: string | number;
}

interface Props {
  entitySchema: EntitySchema;
  customColumns?: Record<string, CustomColumnConfig>;
}

const columns = defineModel<string[]>({ required: true });
const props = defineProps<Props>();

const { liveMessage, onGripStart, setItemRef, getItemBindings, getDropZoneBindings } = useDragAndDrop({ move });

const selectedProperty = ref<string | null>(null);
const keyedColumns = ref<KeyedColumn[]>(columns.value.map((id) => ({ id, key: getUniqueId() })));

const columnIds = computed<string[]>(() => keyedColumns.value.map((c) => c.id));

const options = computed<SelectOption<string>[]>(() => {
  const opts: SelectOption<string>[] = [];
  for (const property of props.entitySchema.properties) {
    let selectableProperty: Property | null = null;
    if (property.type === 'object') {
      selectableProperty = property;
    } else if (property.type === 'relationship') {
      if (isOneToOneRelationship(property)) {
        selectableProperty = property;
      }
    } else if (!columnIds.value.includes(property.id)) {
      selectableProperty = property;
    }
    if (selectableProperty) {
      const customLabel = props.customColumns?.[selectableProperty.id]?.label;
      const label = customLabel
        ? typeof customLabel == 'function'
          ? customLabel(locale.value)
          : customLabel
        : getPropertyTranslation(property);
      opts.push({ value: property.id, label: label });
    }
  }
  if (props.customColumns) {
    for (const customColumnId in props.customColumns) {
      const customColumn = props.customColumns[customColumnId];
      if (customColumn.open !== true) {
        continue;
      }
      if (!columnIds.value.includes(customColumnId)) {
        opts.push({
          value: customColumnId,
          label: typeof customColumn.label == 'function' ? customColumn.label(locale.value) : customColumn.label,
        });
      }
    }
  }

  return opts;
});

function isOneToOneRelationship(property: Property): boolean {
  return property.relationship_type == 'belongs_to' || property.relationship_type == 'has_one';
}

function removeColumn(index: number): void {
  keyedColumns.value.splice(index, 1);
}

function addColumn(): void {
  if (selectedProperty.value) {
    keyedColumns.value.push({ id: selectedProperty.value, key: getUniqueId() });
    selectedProperty.value = null;
  }
}

function move(from: number, to: number): void {
  const item = keyedColumns.value.splice(from, 1)[0];
  keyedColumns.value.splice(to, 0, item);
}

watch(
  keyedColumns,
  (next) => {
    const ids = next.map((c) => c.id);
    const current = columns.value;
    if (ids.length !== current.length || ids.some((id, i) => id !== current[i])) {
      columns.value = ids;
    }
  },
  { deep: true },
);

watch(columns, (next) => {
  const ids = keyedColumns.value.map((c) => c.id);
  if (next.length === ids.length && next.every((id, i) => id === ids[i])) {
    return;
  }
  keyedColumns.value = next.map((id) => ({ id, key: getUniqueId() }));
});
</script>

<template>
  <div :class="classes.sr_only" aria-live="assertive" aria-atomic="true">{{ liveMessage }}</div>
  <ul :class="classes.column_editor_list" :aria-label="translate('columns')">
    <TransitionGroup name="qkit-collapse-horizontal-list">
      <li
        v-for="(column, index) in keyedColumns"
        :ref="(el: any) => setItemRef(el, index)"
        :key="column.key"
        :class="classes.column_editor_list_item"
        v-bind="getItemBindings(index)"
      >
        <ColumnEditorItem
          v-model="keyedColumns[index].id"
          :open="customColumns?.[column.id]?.open === true"
          :entity-schema="entitySchema"
          :label="customColumns?.[column.id]?.label"
          :columns="columnIds"
          @remove="() => removeColumn(index)"
          @grip-start="onGripStart"
        />
      </li>
    </TransitionGroup>
    <div :class="classes.column_picker" v-bind="getDropZoneBindings()">
      <select v-if="options.length" v-model="selectedProperty" :class="classes.input">
        <option value="" disabled hidden />
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <IconButton icon="add" :disabled="!options.length" @click="addColumn" />
    </div>
  </ul>
</template>
