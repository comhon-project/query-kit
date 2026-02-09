<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import IconButton from '@components/Common/IconButton.vue';
import Modal from '@components/Common/Modal.vue';
import ColumnChoice from '@components/Collection/ColumnChoice.vue';
import { translate, locale } from '@i18n/i18n';
import { classes } from '@core/ClassManager';
import { getPropertyTranslation, type EntitySchema, type Property } from '@core/EntitySchema';
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

const showModal = ref<boolean>(false);
const selectedProperty = ref<string | null>(null);
const keyedColumns = ref<KeyedColumn[]>([]);

const columnIds = computed<string[]>(() => keyedColumns.value.map((c) => c.id));
const disableConfirm = computed<boolean>(() => keyedColumns.value.length === 0);

const options = computed<SelectOption<string>[]>(() => {
  const opts: SelectOption<string>[] = [];
  for (const property of props.entitySchema.properties) {
    let selectableProperty: Property | null = null;
    if (property.type != 'relationship') {
      if (!columnIds.value.includes(property.id)) {
        selectableProperty = property;
      }
    } else if (isOneToOneRelationship(property)) {
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

function openModal(): void {
  showModal.value = true;
}

function confirm(): void {
  columns.value = keyedColumns.value.map((c) => c.id);
  showModal.value = false;
}

function cancel(): void {
  showModal.value = false;
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

watchEffect(() => (keyedColumns.value = columns.value.map((id) => ({ id, key: getUniqueId() }))));
</script>

<template>
  <IconButton icon="columns" @click="openModal" />
  <Modal v-model:show="showModal" :disable-confirm="disableConfirm" @confirm="confirm" @cancel="cancel">
    <template #header>
      <h1>{{ translate('columns') }}</h1>
    </template>
    <template #body>
      <div :class="classes.column_choices">
        <ul>
          <TransitionGroup name="qkit-collapse-horizontal-list">
            <li
              v-for="(column, index) in keyedColumns"
              :key="column.key"
              :class="classes.grid_container_for_transition"
            >
              <ColumnChoice
                v-model="keyedColumns[index].id"
                :property-id="customColumns?.[column.id]?.open === true ? undefined : column.id"
                :entity-schema="entitySchema"
                :label="customColumns?.[column.id]?.label"
                :columns="columnIds"
                @remove="() => removeColumn(index)"
              />
            </li>
          </TransitionGroup>
          <div :class="classes.column_add">
            <select v-if="options.length" v-model="selectedProperty" :class="classes.input">
              <option value="" disabled hidden />
              <option v-for="option in options" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <IconButton icon="add" :disabled="!options.length" @click="addColumn" />
          </div>
        </ul>
      </div>
    </template>
  </Modal>
</template>
