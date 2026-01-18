<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { classes } from '@core/ClassManager';
import { locale, translate } from '@i18n/i18n';
import Modal from '@components/Common/Modal.vue';
import ColumnChoice from '@components/Collection/ColumnChoice.vue';
import { resolve, getPropertyTranslation, type EntitySchema, type Property } from '@core/EntitySchema';
import IconButton from '@components/Common/IconButton.vue';
import { getUniqueId } from '@core/Utils';
import type { CustomColumnConfig, SelectOption } from '@core/types';

interface KeyedColumn {
  id: string;
  key: string | number;
}

interface Props {
  entity: string;
  columns: string[];
  customColumns?: Record<string, CustomColumnConfig>;
}

interface Emits {
  'update:columns': [columns: string[]];
}

const emit = defineEmits<Emits>();
const show = defineModel<boolean>('show', { required: true });
const props = defineProps<Props>();

const schema = ref<EntitySchema | null>(null);
const newColumns = ref<KeyedColumn[]>([]);
const confirmed = ref<boolean>(false);
const updated = ref<boolean>(false);
const selectedProperty = ref<string | null>(null);
const options = computed<SelectOption<string>[]>(() => {
  if (!schema.value) return [];
  const opts: SelectOption<string>[] = [];
  for (const property of schema.value.properties) {
    let selectableProperty: Property | null = null;
    if (property.type != 'relationship') {
      const column = newColumns.value.find((column) => {
        return property.id == column.id;
      });
      if (!column) {
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
      const column = newColumns.value.find((column) => {
        return customColumnId == column.id;
      });
      if (!column) {
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

function confirm(): void {
  confirmed.value = true;
  show.value = false;
}

function updateColumns(): void {
  if (!updated.value) {
    return;
  }
  if (confirmed.value) {
    emit(
      'update:columns',
      newColumns.value.map((column) => column.id),
    );
  } else {
    newColumns.value = props.columns.map((columnId) => getKeyedColumn(columnId));
  }
}

function getKeyedColumn(columnId: string): KeyedColumn {
  return { id: columnId, key: getUniqueId() };
}

function removeColumn(index: number): void {
  newColumns.value.splice(index, 1);
}

function addColumn(): void {
  if (selectedProperty.value) {
    newColumns.value.push(getKeyedColumn(selectedProperty.value));
    selectedProperty.value = null;
  }
}

watch(
  () => props.columns,
  () => (newColumns.value = props.columns.map((columnId) => getKeyedColumn(columnId))),
  { immediate: true },
);

watch(
  () => props.entity,
  async () => (schema.value = await resolve(props.entity)),
  { immediate: true },
);
watch(newColumns, () => (updated.value = true), { deep: true });
watch(show, () => {
  if (show.value) {
    // reset states only when displaying modal
    updated.value = false;
    confirmed.value = false;
  }
});
</script>

<template>
  <Modal v-model:show="show" :disable-confirm="newColumns.length === 0" @confirm="confirm" @closed="updateColumns">
    <template #header>
      <h1>{{ translate('columns') }}</h1>
    </template>
    <template #body>
      <div :class="classes.column_choices">
        <ul>
          <TransitionGroup name="qkit-collapse-horizontal-list">
            <li v-for="(column, index) in newColumns" :key="column.key" :class="classes.grid_container_for_transition">
              <ColumnChoice
                v-model:column-id="column.id"
                :property-id="customColumns?.[column.id]?.open === true ? undefined : column.id"
                :entity="entity"
                :label="customColumns?.[column.id]?.label"
                :columns="newColumns"
                @remove="() => removeColumn(index)"
              />
            </li>
          </TransitionGroup>
          <div v-if="schema" :class="classes.column_add">
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
