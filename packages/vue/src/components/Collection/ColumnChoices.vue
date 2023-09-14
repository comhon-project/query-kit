<script setup>
import { computed, ref, watch } from 'vue';
import { classes } from '../../core/ClassManager';
import { translate } from '../../i18n/i18n';
import Modal from '../Common/Modal.vue';
import ColumnChoice from './ColumnChoice.vue';
import { resolve } from '../../core/Schema';
import IconButton from '../Common/IconButton.vue';
import Utils from '../../core/Utils';

const emit = defineEmits(['update:show', 'update:columns']);
const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
  },
});

const schema = ref(null);
const newColumns = ref([]);
const confirmed = ref(false);
const updated = ref(false);
const selectedProperty = ref(null);
const isVisible = computed({
  get() {
    return props.show;
  },
  set(value) {
    emit('update:show', value);
  },
});
const options = computed(() => {
  const options = [];
  for (const property of schema.value.properties) {
    if (property.type != 'relationship') {
      const column = newColumns.value.find((column) => {
        return property.id == column.id;
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

function confirm() {
  confirmed.value = true;
  isVisible.value = false;
}

function updateColumns() {
  if (!updated.value) {
    return;
  }
  if (confirmed.value) {
    emit('update:columns', [...newColumns.value]);
  } else {
    newColumns.value = props.columns.map((column) => ({ ...column }));
  }
}

function removeColumn(index) {
  newColumns.value.splice(index, 1);
}

function addColumn() {
  if (selectedProperty.value) {
    newColumns.value.push({ id: selectedProperty.value, _key: Utils.getUniqueId(true) });
    selectedProperty.value = null;
  }
}

watch(
  () => props.columns,
  () => (newColumns.value = props.columns.map((column) => ({ ...column }))),
  { immediate: true }
);

watch(
  () => props.model,
  async () => (schema.value = await resolve(props.model)),
  { immediate: true }
);
watch(newColumns, () => (updated.value = true), { deep: true });
watch(isVisible, () => {
  if (isVisible.value) {
    // reset states only when displaying modal
    updated.value = false;
    confirmed.value = false;
  }
});
</script>

<template>
  <Modal v-model:show="isVisible" :disable-confirm="newColumns.length === 0" @confirm="confirm" @closed="updateColumns">
    <template #header>
      <h1>{{ translate('columns') }}</h1>
    </template>
    <template #body>
      <div :class="classes.column_choices">
        <ul>
          <TransitionGroup name="qkit-collapse-horizontal-list">
            <li v-for="(column, index) in newColumns" :key="column._key">
              <ColumnChoice
                v-model:property-id="column.id"
                :model="model"
                :label="column.label"
                :columns="newColumns"
                @remove="() => removeColumn(index)"
              />
            </li>
          </TransitionGroup>
          <div v-if="schema" :class="classes.column_add">
            <select v-if="options.length" v-model="selectedProperty" :class="classes.input">
              <option value="" disabled hidden />
              <option v-for="property in options" :key="property" :value="property.id">
                {{ property.name }}
              </option>
            </select>
            <IconButton icon="add" :disabled="!options.length" @click="addColumn" />
          </div>
        </ul>
      </div>
    </template>
  </Modal>
</template>
