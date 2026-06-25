<script setup lang="ts">
import { computed, ref } from 'vue';
import IconButton from '@components/Common/IconButton.vue';
import ColumnEditorItem from '@components/Collection/ColumnEditorItem.vue';
import { translate, locale } from '@i18n/i18n';
import { classes } from '@core/ClassManager';
import { getPropertyTranslation, type EntitySchema, type Property } from '@core/EntitySchema';
import { useDragAndDrop } from '@core/useDragAndDrop';
import { useInternalModel } from '@components/Composable/InternalModel';
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
const internalModel = useInternalModel<string[], KeyedColumn[]>(columns, {
  normalize: (ids) => ids.map((id) => ({ id, key: getUniqueId() })),
  strip: (keyed) => keyed.map((c) => c.id),
});

const columnIds = computed<string[]>(() => internalModel.value.map((c) => c.id));

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
  internalModel.value.splice(index, 1);
}

function addColumn(): void {
  if (selectedProperty.value) {
    internalModel.value.push({ id: selectedProperty.value, key: getUniqueId() });
    selectedProperty.value = null;
  }
}

function move(from: number, to: number): void {
  const item = internalModel.value.splice(from, 1)[0];
  internalModel.value.splice(to, 0, item);
}
</script>

<template>
  <div :class="classes.sr_only" aria-live="assertive" aria-atomic="true">{{ liveMessage }}</div>
  <ul :class="classes.column_editor_list" :aria-label="translate('columns')">
    <TransitionGroup name="qkit-collapse-horizontal-list">
      <li
        v-for="(column, index) in internalModel"
        :ref="(el: any) => setItemRef(el, index)"
        :key="column.key"
        :class="classes.column_editor_list_item"
        v-bind="getItemBindings(index)"
      >
        <ColumnEditorItem
          v-model="internalModel[index].id"
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
