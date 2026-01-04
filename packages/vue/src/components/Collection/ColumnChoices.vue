<script setup>
import { computed, ref, watch } from 'vue';
import { classes } from '@core/ClassManager';
import { locale, translate } from '@i18n/i18n';
import Modal from '@components/Common/Modal.vue';
import ColumnChoice from '@components/Collection/ColumnChoice.vue';
import { resolve, getPropertyTranslation } from '@core/EntitySchema';
import IconButton from '@components/Common/IconButton.vue';
import Utils from '@core/Utils';

const emit = defineEmits(['update:columns']);
const show = defineModel('show', { type: Boolean, required: true });
const props = defineProps({
  entity: {
    type: String,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
  },
  customColumns: {
    type: Object,
    default: undefined,
  },
});

const schema = ref(null);
const newColumns = ref([]);
const confirmed = ref(false);
const updated = ref(false);
const selectedProperty = ref(null);
const options = computed(() => {
  const options = [];
  for (const property of schema.value.properties) {
    let selectableProperty = null;
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
      options.push({ value: property.id, label: label });
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
        options.push({
          value: customColumnId,
          label: typeof customColumn.label == 'function' ? customColumn.label(locale.value) : customColumn.label,
        });
      }
    }
  }

  return options;
});

function isOneToOneRelationship(property) {
  return property.relationship_type == 'belongs_to' || property.relationship_type == 'has_one';
}

function confirm() {
  confirmed.value = true;
  show.value = false;
}

function updateColumns() {
  if (!updated.value) {
    return;
  }
  if (confirmed.value) {
    emit(
      'update:columns',
      newColumns.value.map((column) => column.id)
    );
  } else {
    newColumns.value = props.columns.map((columnId) => getKeyedColumn(columnId));
  }
}

function getKeyedColumn(columnId) {
  return { id: columnId, key: Utils.getUniqueId() };
}

function removeColumn(index) {
  newColumns.value.splice(index, 1);
}

function addColumn() {
  if (selectedProperty.value) {
    newColumns.value.push(getKeyedColumn(selectedProperty.value));
    selectedProperty.value = null;
  }
}

watch(
  () => props.columns,
  () => (newColumns.value = props.columns.map((columnId) => getKeyedColumn(columnId))),
  { immediate: true }
);

watch(
  () => props.entity,
  async () => (schema.value = await resolve(props.entity)),
  { immediate: true }
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
