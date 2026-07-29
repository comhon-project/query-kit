<script setup>
import { computed, reactive, ref, shallowRef, watch } from 'vue';
import { locale } from '@query-kit/vue';
import { generateRow } from './core/MockDataGenerator';
import RequestDisplay from './components/RequestDisplay.vue';

const lastRequest = shallowRef(null);
const requester = {
  request: (query) => {
    lastRequest.value = structuredClone(query);
    const lastPage = 5;
    const queryLimit = query.limit ?? 20;
    const count = lastPage * queryLimit - 1;
    const remaining = Math.max(0, count - (query.page - 1) * queryLimit);
    const limit = Math.min(queryLimit, remaining);
    const collection = [];
    for (let index = 0; index < limit; index++) {
      collection.push(generateRow(query.entity, query.properties));
    }
    return new Promise((resolve) => {
      setTimeout(() => resolve({ count, collection, limit: queryLimit }), 200);
    });
  },
};

// Default displayed fields per entity, applied whenever the entity changes.
const entityFields = {
  user: ['first_name', 'last_name', 'married', 'birth_date', 'company', 'company.country', 'favorite_fruits'],
  organization: ['brand_name', 'address', 'description', 'country', 'contacts'],
  car: ['brand', 'numberplate'],
  office: ['address', 'surface'],
};
const entities = Object.keys(entityFields);

const component = ref('search'); // 'search' | 'builder' | 'collection'
const settingsCollapsed = ref(true);

// Shared v-model data. Reset to the entity's defaults whenever the entity changes.
const entity = ref('user');
const fields = ref([...entityFields.user]);
const sort = ref([]);
const filter = ref(null);
const page = ref(1);

watch(entity, (value) => {
  fields.value = [...(entityFields[value] ?? [])];
  sort.value = [];
  filter.value = null;
  page.value = 1;
});

// Per-component typed settings. Complex props (allowed-*, custom-fields, initial
// filter) are intentionally left out and kept at their component defaults.
const settings = reactive({
  search: {
    manual: false,
    directQuery: true,
    displayOperator: true,
    displayCount: true,
    allowReset: true,
    allowUndoRedo: true,
    reflow: false,
    filterEditingLocation: 'query-builder',
    fieldsEditingLocation: 'collection',
    sortEditingLocation: 'collection-column',
    infiniteScroll: true,
    rowClick: false,
    fieldClick: false,
  },
  builder: {
    editFilter: true,
    editFields: true,
    editSort: true,
    manual: false,
    displayOperator: true,
    allowReset: true,
    allowUndoRedo: true,
  },
  collection: {
    directQuery: true,
    displayCount: true,
    manual: false,
    reflow: false,
    editFields: true,
    sortEditingLocation: 'collection-column',
    infiniteScroll: true,
    rowClick: false,
    fieldClick: false,
  },
});

// Drives the settings panel: which control renders for each setting.
const settingsSchema = {
  search: [
    { key: 'manual', type: 'bool' },
    { key: 'directQuery', type: 'bool' },
    { key: 'displayOperator', type: 'bool' },
    { key: 'displayCount', type: 'bool' },
    { key: 'allowReset', type: 'bool' },
    { key: 'allowUndoRedo', type: 'bool', label: 'Allow undo/redo' },
    { key: 'reflow', type: 'bool' },
    { key: 'infiniteScroll', type: 'bool' },
    { key: 'rowClick', type: 'bool' },
    { key: 'fieldClick', type: 'bool', label: 'Field click (first column)' },
    { key: 'filterEditingLocation', type: 'enum', options: ['query-builder', 'none'] },
    { key: 'fieldsEditingLocation', type: 'enum', options: ['query-builder', 'collection', 'none'] },
    { key: 'sortEditingLocation', type: 'enum', options: ['query-builder', 'collection-modal', 'collection-column', 'none'] },
  ],
  builder: [
    { key: 'editFilter', type: 'bool' },
    { key: 'editFields', type: 'bool' },
    { key: 'editSort', type: 'bool' },
    { key: 'manual', type: 'bool' },
    { key: 'displayOperator', type: 'bool' },
    { key: 'allowReset', type: 'bool' },
    { key: 'allowUndoRedo', type: 'bool', label: 'Allow undo/redo' },
  ],
  collection: [
    { key: 'directQuery', type: 'bool' },
    { key: 'displayCount', type: 'bool' },
    { key: 'manual', type: 'bool' },
    { key: 'reflow', type: 'bool' },
    { key: 'editFields', type: 'bool' },
    { key: 'infiniteScroll', type: 'bool' },
    { key: 'rowClick', type: 'bool' },
    { key: 'fieldClick', type: 'bool', label: 'Field click (first column)' },
    { key: 'sortEditingLocation', type: 'enum', options: ['collection-modal', 'collection-column', 'none'] },
  ],
};


// Human-readable label from a camelCase prop name: "directQuery" -> "Direct query".
function humanize(key) {
  const words = key.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Filter presets per entity, used by the generate buttons in the query-builder components.
const filterPresets = {
  user: [
    { type: 'condition', property: 'last_name', operator: 'ilike', value: 'smith' },
    { type: 'condition', property: 'age', operator: '>=', value: 18 },
    { type: 'condition', property: 'country', operator: 'in', value: ['2', '3'] },
    {
      type: 'group',
      operator: 'or',
      filters: [
        { type: 'condition', property: 'birth_date', operator: '>=', value: '2000-01-01T00:00:00Z' },
        { type: 'condition', property: 'married', operator: '=', value: true },
        {
          type: 'entity_condition',
          operator: 'has',
          property: 'favorite_client',
          entities: ['organization'],
          filter: { type: 'condition', property: 'brand_name', operator: 'ilike', value: 'tech' },
        },
      ],
    },
    {
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      filter: {
        type: 'entity_condition',
        operator: 'has',
        property: 'contacts',
        count_operator: '<=',
        count: 100,
      },
    },
  ],
  organization: [
    { type: 'condition', property: 'brand_name', operator: 'ilike', value: 'tech' },
    { type: 'condition', property: 'country', operator: 'in', value: ['1', '2'] },
    { type: 'entity_condition', operator: 'has', property: 'contacts', count_operator: '>=', count: 1 },
    { type: 'entity_condition', operator: 'has', property: 'offices', count_operator: '>=', count: 1 },
  ],
  car: [
    { type: 'condition', property: 'brand', operator: 'ilike', value: 'toyota' },
    { type: 'condition', property: 'numberplate', operator: 'ilike', value: 'AB-123' },
  ],
  office: [
    { type: 'condition', property: 'address', operator: 'ilike', value: 'main street' },
    { type: 'condition', property: 'surface', operator: '>=', value: 100 },
  ],
};

function lockNode(node, { fixed, readonly }) {
  if (fixed) node.removable = false;
  if (readonly) node.editable = false;
  if (node.type === 'group') node.filters.forEach((child) => lockNode(child, { fixed, readonly }));
  if (node.type === 'entity_condition' && node.filter) lockNode(node.filter, { fixed, readonly });
}
function entityFilter(entityId, { fixed = false, readonly = false } = {}) {
  const filters = structuredClone(filterPresets[entityId] ?? []);
  if (fixed || readonly) filters.forEach((node) => lockNode(node, { fixed, readonly }));
  return { type: 'group', operator: 'and', filters, ...((fixed || readonly) && { editable: false }) };
}
function generateFilter() {
  filter.value = entityFilter(entity.value);
}
function generateFixedFilter() {
  filter.value = entityFilter(entity.value, { fixed: true });
}
function generateReadonlyFilter() {
  filter.value = entityFilter(entity.value, { fixed: true, readonly: true });
}

// Row / field click demo: the clicked payload is shown in a modal.
const clicked = shallowRef(null);
function onItemClick(item) {
  clicked.value = { title: 'Row clicked', data: item };
}
function onFieldClick(value, item, fieldId, event) {
  event.stopPropagation();
  clicked.value = { title: `Field clicked: ${fieldId}`, data: value };
}
const customFields = computed(() => {
  const firstField = fields.value[0];
  return settings[component.value]?.fieldClick && firstField ? { [firstField]: { onFieldClick } } : undefined;
});
// When reflow is on, the component is wrapped in a resizable box so its
// container-query breakpoint can be exercised by dragging the width. A custom
// full-height handle on the right edge drives the width (native `resize` only
// exposes a small, hard-to-find corner grip).
const reflowEnabled = computed(() => Boolean(settings[component.value].reflow));
const reflowWidth = ref(360);

function startResize(event) {
  event.preventDefault();
  const box = event.currentTarget.parentElement;
  const available = box.parentElement.clientWidth;
  const startX = event.clientX;
  const startWidth = reflowWidth.value;
  const onMove = (moveEvent) => {
    reflowWidth.value = Math.max(240, Math.min(startWidth + (moveEvent.clientX - startX), available));
  };
  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

const theme = ref('auto');
function onThemeChange() {
  document.documentElement.style.colorScheme = theme.value === 'auto' ? 'light dark' : theme.value;
}
</script>

<template>
  <div class="root-app">
    <p class="playground-notice">There is no backend — data is randomly generated and not actually filtered or sorted.</p>

    <div class="playground-toolbar">
      <select v-model="component" class="qkit-input" aria-label="Component">
        <option value="search">QkitSearch</option>
        <option value="builder">QkitQueryBuilder</option>
        <option value="collection">QkitCollection</option>
      </select>
      <select v-model="theme" class="qkit-input" style="margin-left: auto" @change="onThemeChange">
        <option value="auto">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <select v-model="locale" class="qkit-input">
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="de">Deutsch</option>
        <option value="es">Español</option>
        <option value="pt">Português</option>
        <option value="ru">Русский</option>
        <option value="zh">中文</option>
        <option value="ja">日本語</option>
        <option value="ar">العربية</option>
        <option value="hi">हिन्दी</option>
        <option value="bn">বাংলা</option>
      </select>
    </div>

    <section class="playground-settings">
      <button
        type="button"
        class="settings-toggle"
        :aria-expanded="!settingsCollapsed"
        @click="settingsCollapsed = !settingsCollapsed"
      >
        <span aria-hidden="true">{{ settingsCollapsed ? '▸' : '▾' }}</span>
        Settings ({{ component }})
      </button>
      <div class="settings-body" :class="{ 'settings-body--collapsed': settingsCollapsed }">
        <div class="settings-body-inner">
          <div class="settings-grid">
            <div class="setting-row">
              <span class="setting-key">Entity</span>
              <select v-model="entity" class="qkit-input">
                <option v-for="entityId in entities" :key="entityId" :value="entityId">{{ entityId }}</option>
              </select>
            </div>
            <div v-for="setting in settingsSchema[component]" :key="setting.key" class="setting-row">
              <span class="setting-key">{{ setting.label ?? humanize(setting.key.replace('Location', '')) }}</span>
              <input
                v-if="setting.type === 'bool'"
                v-model="settings[component][setting.key]"
                type="checkbox"
              />
              <select
                v-else-if="setting.type === 'enum'"
                v-model="settings[component][setting.key]"
                class="qkit-input"
              >
                <option v-for="option in setting.options" :key="option" :value="option">{{ option }}</option>
              </select>
              <input
                v-else-if="setting.type === 'number'"
                v-model.number="settings[component][setting.key]"
                type="number"
                min="1"
                class="qkit-input"
              />
              <input
                v-else-if="setting.type === 'text'"
                v-model="settings[component][setting.key]"
                type="text"
                class="qkit-input"
              />
            </div>
          </div>
          <div v-if="component !== 'collection'" class="settings-actions">
            <button type="button" :disabled="!filterPresets[entity]" @click="generateFilter">Generate sample filter</button>
            <button type="button" :disabled="!filterPresets[entity]" @click="generateFixedFilter">
              Generate sample fixed filter
            </button>
            <button type="button" :disabled="!filterPresets[entity]" @click="generateReadonlyFilter">
              Generate sample read-only filter
            </button>
          </div>
        </div>
      </div>
    </section>

    <div :class="{ 'reflow-box': reflowEnabled }" :style="reflowEnabled ? { width: reflowWidth + 'px' } : null">
      <QkitSearch
        v-if="component === 'search'"
        :key="'search-' + settings.search.directQuery"
        v-model:fields="fields"
        v-model:sort="sort"
        v-model:filter="filter"
        v-model:page="page"
        :entity="entity"
        :requester="requester"
        :manual="settings.search.manual"
        :direct-query="settings.search.directQuery"
        :display-operator="settings.search.displayOperator"
        :display-count="settings.search.displayCount"
        :allow-reset="settings.search.allowReset"
        :allow-undo="settings.search.allowUndoRedo"
        :allow-redo="settings.search.allowUndoRedo"
        :reflow="settings.search.reflow"
        :filter-editing-location="settings.search.filterEditingLocation"
        :fields-editing-location="settings.search.fieldsEditingLocation"
        :sort-editing-location="settings.search.sortEditingLocation"
        :allowed-collection-types="[settings.search.infiniteScroll ? 'infinite' : 'pagination']"
        :on-item-click="settings.search.rowClick ? onItemClick : undefined"
        :custom-fields="customFields"
      />

      <QkitQueryBuilder
        v-else-if="component === 'builder'"
        v-model:filter="filter"
        v-model:fields="fields"
        v-model:sort="sort"
        :entity="entity"
        :edit-filter="settings.builder.editFilter"
        :edit-fields="settings.builder.editFields"
        :edit-sort="settings.builder.editSort"
        :manual="settings.builder.manual"
        :display-operator="settings.builder.displayOperator"
        :allow-reset="settings.builder.allowReset"
        :allow-undo="settings.builder.allowUndoRedo"
        :allow-redo="settings.builder.allowUndoRedo"
      />

      <QkitCollection
        v-else-if="component === 'collection'"
        :key="'collection-' + settings.collection.directQuery"
        v-model:fields="fields"
        v-model:sort="sort"
        v-model:page="page"
        :entity="entity"
        :requester="requester"
        :filter="filter"
        :direct-query="settings.collection.directQuery"
        :display-count="settings.collection.displayCount"
        :manual="settings.collection.manual"
        :reflow="settings.collection.reflow"
        :edit-fields="settings.collection.editFields"
        :sort-editing-location="settings.collection.sortEditingLocation"
        :allowed-collection-types="[settings.collection.infiniteScroll ? 'infinite' : 'pagination']"
        :on-item-click="settings.collection.rowClick ? onItemClick : undefined"
        :custom-fields="customFields"
      />

      <div v-if="reflowEnabled" class="reflow-handle" title="Drag to resize" @pointerdown="startResize" />
    </div>

    <div class="playground-displays">
      <RequestDisplay :request="filter" title="Filter" />
      <RequestDisplay :request="sort" title="Sort" />
      <RequestDisplay :request="fields" title="Fields" />
      <RequestDisplay :request="lastRequest" title="Request" />
    </div>

    <div v-if="clicked" class="playground-modal" @click.self="clicked = null">
      <div class="playground-modal-box">
        <button type="button" class="playground-modal-close" @click="clicked = null">✕</button>
        <RequestDisplay :request="clicked.data" :title="clicked.title" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.playground-settings {
  border: 1px solid var(--qkit-color-border);
  border-radius: 6px;
  padding: 12px;
  margin: 12px 0;
}
.settings-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  text-align: left;
}
.settings-body {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.2s ease;
}
.settings-body--collapsed {
  grid-template-rows: 0fr;
}
.settings-body-inner {
  min-height: 0;
  overflow: hidden;
}
@media (prefers-reduced-motion: reduce) {
  .settings-body {
    transition: none;
  }
}
.settings-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--qkit-color-border);
}
.settings-actions button {
  padding: 5px 12px;
  font-size: 13px;
  border: 1px solid var(--qkit-color-border);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}
.settings-actions button:hover:not(:disabled) {
  border-color: var(--qkit-color-primary);
  color: var(--qkit-color-primary);
}
.settings-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px 20px;
  margin-top: 10px;
}
.setting-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.setting-key {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}
.setting-row select {
  min-width: 0;
  max-width: 55%;
}
.reflow-box {
  position: relative;
  min-width: 240px;
  max-width: 100%;
  padding-right: 14px;
  border: 1px solid var(--qkit-color-border);
  border-radius: 6px;
}
.reflow-handle {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 100%;
  cursor: ew-resize;
  touch-action: none;
}
.reflow-handle::before {
  content: '';
  width: 4px;
  height: 28px;
  border-radius: 2px;
  background: var(--qkit-color-border);
  animation: reflow-shimmer 1.6s ease-in-out infinite;
  transition:
    background-color 0.15s ease,
    height 0.15s ease;
}
.reflow-handle:hover::before {
  height: 44px;
  background: var(--qkit-color-primary);
  animation: none;
}
@keyframes reflow-shimmer {
  0%,
  100% {
    background: var(--qkit-color-border);
  }
  50% {
    background: var(--qkit-color-primary);
  }
}
@media (prefers-reduced-motion: reduce) {
  .reflow-handle::before {
    animation: none;
  }
}
.playground-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgb(0 0 0 / 0.5);
}
.playground-modal-box {
  position: relative;
  width: 560px;
  max-width: 100%;
  max-height: 80vh;
  overflow: auto;
}
.playground-modal-box :deep(.request-display) {
  margin-top: 0;
}
.playground-modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  color: var(--qkit-text-color);
}

/* The filter/sort/fields/request JSON dumps are noise on phones. */
@media (max-width: 992px) {
  .playground-displays {
    display: none;
  }
}
</style>
