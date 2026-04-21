<script setup>
import { reactive, ref, shallowRef } from 'vue';
import { locale } from '@query-kit/vue';
import { generateRow } from './core/MockDataGenerator';
import RequestDisplay from './components/RequestDisplay.vue';

const activeTab = ref('default');
const lastRequest = shallowRef(null);

const tabs = [
  { id: 'default', label: 'Default' },
  { id: 'prefilled', label: 'Pre-filled' },
  { id: 'manual', label: 'Manual' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'restricted', label: 'Restricted' },
  { id: 'clicks', label: 'Clicks' },
  { id: 'fixed', label: 'Fixed' },
];

const customColumns = {
  age_weight: {
    label: (locale) => (locale === 'fr' ? 'âge / poids' : 'age / weight'),
    open: true,
    sort: ['age', 'weight'],
    properties: ['age', 'weight'],
    renderer: (cellValue, rowValue, columnId, locale) => {
      const ageLabel = locale === 'fr' ? ' ans' : ' years';
      return `${rowValue['age']}${ageLabel}, ${rowValue['weight']} kg`;
    },
  },
};

function createState(entity, columns, filter = null) {
  return reactive({
    entity,
    columns: [...columns],
    sort: [],
    filter,
    page: 1,
  });
}

const userColumns = ['first_name', 'last_name', 'gender', 'country', 'married', 'birth_date', 'company', 'favorite_fruits'];

const state = {
  default: createState('user', [...userColumns, 'age_weight']),
  prefilled: createState('user', userColumns, {
    type: 'group',
    operator: 'and',
    filters: [
      { type: 'condition', property: 'last_name', operator: 'ilike' },
      { type: 'condition', property: 'age', operator: '>=', value: 18 },
      { type: 'entity_condition', operator: 'has', property: 'company', count_operator: '>=', count: 1 },
      { type: 'scope', id: 'quick_search', parameters: [''] },
    ],
  }),
  manual: createState('user', userColumns),
  minimal: createState('user', ['first_name', 'last_name', 'age', 'company']),
  restricted: createState('user', ['first_name', 'last_name', 'age', 'gender', 'company']),
  clicks: createState('user', ['first_name', 'last_name', 'age', 'company']),
  fixed: createState('organization', ['brand_name', 'address', 'description', 'country', 'contacts'], {
    type: 'group',
    operator: 'and',
    editable: false,
    filters: [
      { type: 'condition', property: 'brand_name', operator: 'ilike', removable: false },
      { type: 'condition', property: 'country', operator: 'ilike', removable: false },
      {
        type: 'entity_condition',
        operator: 'has',
        property: 'contacts',
        count_operator: '>=',
        count: 1,
        removable: false,
        filter: { type: 'condition', property: 'first_name', operator: 'ilike', removable: false },
      },
    ],
  }),
};

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

const clickedRow = shallowRef(null);
const clickedCell = shallowRef(null);

function onRowClick(row) {
  clickedRow.value = row;
}

function onCellClick(value, rowValue, columnId, event) {
  event.stopPropagation();
  clickedCell.value = { columnId, value };
}
</script>

<template>
  <div class="root-app">
    <p class="playground-notice">There is no backend — data is randomly generated and not actually filtered.</p>
    <div class="playground-toolbar">
      <div class="playground-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
      <select v-model="locale" class="qkit-input" style="margin-left: auto">
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

    <!-- Default -->
    <div v-if="activeTab === 'default'">
      <p class="playground-description">All features enabled: column editor, pagination/infinite scroll, undo/redo, custom columns, sort.</p>
      <div style="height: 80vh">
        <QkitSearch
          :entity="state.default.entity"
          v-model:columns="state.default.columns"
          v-model:sort="state.default.sort"
          v-model:filter="state.default.filter"
          v-model:page="state.default.page"
          :requester="requester"
          :custom-columns="customColumns"
          :edit-columns="true"
          :allowed-collection-types="['infinite', 'pagination']"
          user-timezone="Europe/Paris"
        />
      </div>
    </div>

    <!-- Pre-filled -->
    <div v-if="activeTab === 'prefilled'">
      <p class="playground-description">Filter is initialized with conditions, an entity condition with count, and a scope.</p>
      <div style="height: 80vh">
        <QkitSearch
          :entity="state.prefilled.entity"
          v-model:columns="state.prefilled.columns"
          v-model:sort="state.prefilled.sort"
          v-model:filter="state.prefilled.filter"
          v-model:page="state.prefilled.page"
          :requester="requester"
          :edit-columns="true"
          :allowed-collection-types="['infinite', 'pagination']"
          user-timezone="Europe/Paris"
        />
      </div>
    </div>

    <!-- Manual -->
    <div v-if="activeTab === 'manual'">
      <p class="playground-description">The query is not sent automatically. Click the search button to trigger the request.</p>
      <div style="height: 80vh">
        <QkitSearch
          :entity="state.manual.entity"
          v-model:columns="state.manual.columns"
          v-model:sort="state.manual.sort"
          v-model:filter="state.manual.filter"
          v-model:page="state.manual.page"
          :requester="requester"
          :manual="true"
          :edit-columns="true"
          user-timezone="Europe/Paris"
        />
      </div>
    </div>

    <!-- Minimal -->
    <div v-if="activeTab === 'minimal'">
      <p class="playground-description">Stripped-down UI: no operators, no undo/redo/reset, no column editor, no result count.</p>
      <div style="height: 80vh">
        <QkitSearch
          :entity="state.minimal.entity"
          v-model:columns="state.minimal.columns"
          v-model:sort="state.minimal.sort"
          v-model:filter="state.minimal.filter"
          v-model:page="state.minimal.page"
          :requester="requester"
          :display-operator="false"
          :allow-reset="false"
          :allow-undo="false"
          :allow-redo="false"
          :edit-columns="false"
          :display-count="false"
        />
      </div>
    </div>

    <!-- Restricted -->
    <div v-if="activeTab === 'restricted'">
      <p class="playground-description">Only a few properties, one scope, and two operators (= and &lt;&gt;) are allowed.</p>
      <div style="height: 80vh">
        <QkitSearch
          :entity="state.restricted.entity"
          v-model:columns="state.restricted.columns"
          v-model:sort="state.restricted.sort"
          v-model:filter="state.restricted.filter"
          v-model:page="state.restricted.page"
          :requester="requester"
          :allowed-properties="{ user: ['first_name', 'last_name', 'age', 'gender'], organization: ['brand_name'] }"
          :allowed-scopes="{ user: ['scope'] }"
          :allowed-operators="{ condition: { basic: ['=', '<>'] }, group: ['and'] }"
          :edit-columns="true"
          user-timezone="Europe/Paris"
        />
      </div>
    </div>

    <!-- Clicks -->
    <div v-if="activeTab === 'clicks'">
      <p class="playground-description">Click a row or the company cell to see the event data below.</p>
      <div style="height: 55vh">
        <QkitSearch
          :entity="state.clicks.entity"
          v-model:columns="state.clicks.columns"
          v-model:sort="state.clicks.sort"
          v-model:filter="state.clicks.filter"
          v-model:page="state.clicks.page"
          :requester="requester"
          :on-row-click="onRowClick"
          :custom-columns="{ company: { onCellClick: onCellClick } }"
        />
      </div>
      <div style="display: flex; gap: 1rem; margin-top: 0.75rem">
        <div v-if="clickedRow" class="playground-panel" style="flex: 1">
          <strong>Row clicked</strong>
          <pre>{{ JSON.stringify(clickedRow, null, 2) }}</pre>
        </div>
        <div v-if="clickedCell" class="playground-panel" style="flex: 1">
          <strong>Cell clicked: {{ clickedCell.columnId }}</strong>
          <pre>{{ JSON.stringify(clickedCell.value, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <!-- Fixed -->
    <div v-if="activeTab === 'fixed'">
      <p class="playground-description">Filter structure is fixed: conditions cannot be added or removed, only values can be changed.</p>
      <div style="height: 80vh">
        <QkitSearch
          :entity="state.fixed.entity"
          v-model:columns="state.fixed.columns"
          v-model:sort="state.fixed.sort"
          v-model:filter="state.fixed.filter"
          v-model:page="state.fixed.page"
          :requester="requester"
          user-timezone="Europe/Paris"
        />
      </div>
    </div>

    <RequestDisplay :request="lastRequest" />
  </div>
</template>
