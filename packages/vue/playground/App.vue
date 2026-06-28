<script setup>
import { computed, reactive, ref, shallowRef } from 'vue';
import { locale } from '@query-kit/vue';
import { generateRow } from './core/MockDataGenerator';
import RequestDisplay from './components/RequestDisplay.vue';

const activeTab = ref('default');
const lastRequest = shallowRef(null);

const currentState = computed(() => state[activeTab.value]);

const tabs = [
  { id: 'default', label: 'Default' },
  { id: 'prefilled', label: 'Pre-filled' },
  { id: 'manual', label: 'Manual' },
  { id: 'deferred', label: 'Deferred query' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'restricted', label: 'Restricted' },
  { id: 'clicks', label: 'Clicks' },
  { id: 'fixed', label: 'Fixed' },
  { id: 'embedded', label: 'Embedded actions' },
];

const customFields = {
  age_weight: {
    label: (locale) => (locale === 'fr' ? 'âge / poids' : 'age / weight'),
    open: true,
    sort: ['age', 'weight'],
    properties: ['age', 'weight'],
    renderer: (value, item, fieldId, locale) => {
      const ageLabel = locale === 'fr' ? ' ans' : ' years';
      return `${item['age']}${ageLabel}, ${item['weight']} kg`;
    },
  },
};

function createState(entity, fields, filter = null) {
  return reactive({
    entity,
    fields: [...fields],
    sort: [],
    filter,
    page: 1,
  });
}

const userFields = [
  'first_name',
  'last_name',
  'gender',
  'country',
  'married',
  'birth_date',
  'company',
  'favorite_fruits',
];

const state = {
  default: createState('user', [...userFields, 'age_weight']),
  prefilled: createState('user', userFields, {
    type: 'group',
    operator: 'and',
    filters: [
      { type: 'condition', property: 'last_name', operator: 'ilike' },
      { type: 'condition', property: 'age', operator: '>=', value: 18 },
      { type: 'condition', property: 'country', operator: 'in' },
      { type: 'entity_condition', operator: 'has', property: 'company', count_operator: '>=', count: 1 },
    ],
  }),
  manual: createState('user', userFields),
  deferred: createState('user', userFields),
  minimal: createState('user', ['first_name', 'last_name', 'age', 'company']),
  restricted: createState('user', ['first_name', 'last_name', 'age', 'gender', 'company']),
  clicks: createState('user', ['first_name', 'last_name', 'age', 'company']),
  embedded: createState('user', userFields),
  fixed: createState('organization', ['brand_name', 'address', 'description', 'country', 'contacts'], {
    type: 'group',
    operator: 'and',
    editable: false,
    filters: [
      { type: 'condition', property: 'brand_name', operator: 'ilike', removable: false },
      { type: 'condition', property: 'country', operator: 'in', removable: false },
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

function onItemClick(item) {
  clickedRow.value = item;
}

function onFieldClick(value, item, fieldId, event) {
  event.stopPropagation();
  clickedCell.value = { fieldId, value };
}

const theme = ref('auto');
function onThemeChange() {
  document.documentElement.style.colorScheme = theme.value === 'auto' ? 'light dark' : theme.value;
}
</script>

<template>
  <div class="root-app">
    <p class="playground-notice">There is no backend — data is randomly generated and not actually filtered.</p>
    <div class="playground-toolbar">
      <div class="playground-tabs">
        <button v-for="tab in tabs" :key="tab.id" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
          {{ tab.label }}
        </button>
      </div>
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

    <!-- Default -->
    <div v-if="activeTab === 'default'">
      <p class="playground-description">
        All features enabled: field editor, pagination/infinite scroll, undo/redo, custom fields, sort.
      </p>
      <QkitSearch
        v-model:fields="state.default.fields"
        v-model:sort="state.default.sort"
        v-model:filter="state.default.filter"
        v-model:page="state.default.page"
        :entity="state.default.entity"
        :requester="requester"
        :custom-fields="customFields"
        :edit-fields="true"
        :allowed-collection-types="['infinite', 'pagination']"
        user-timezone="Europe/Paris"
      />
    </div>

    <!-- Pre-filled -->
    <div v-if="activeTab === 'prefilled'">
      <p class="playground-description">
        Filter is initialized with conditions and an entity condition with count.
      </p>
      <QkitSearch
        v-model:fields="state.prefilled.fields"
        v-model:sort="state.prefilled.sort"
        v-model:filter="state.prefilled.filter"
        v-model:page="state.prefilled.page"
        :entity="state.prefilled.entity"
        :requester="requester"
        :edit-fields="true"
        :allowed-collection-types="['infinite', 'pagination']"
        user-timezone="Europe/Paris"
      />
    </div>

    <!-- Manual -->
    <div v-if="activeTab === 'manual'">
      <p class="playground-description">
        The query is not sent automatically. Click the search button to trigger the request.
      </p>
      <QkitSearch
        v-model:fields="state.manual.fields"
        v-model:sort="state.manual.sort"
        v-model:filter="state.manual.filter"
        v-model:page="state.manual.page"
        :entity="state.manual.entity"
        :requester="requester"
        :manual="true"
        :edit-fields="true"
        user-timezone="Europe/Paris"
      />
    </div>

    <!-- Deferred query -->
    <div v-if="activeTab === 'deferred'">
      <p class="playground-description">
        directQuery=false: the collection does not query on load; the request only fires once the filter changes.
      </p>
      <QkitSearch
        v-model:fields="state.deferred.fields"
        v-model:sort="state.deferred.sort"
        v-model:filter="state.deferred.filter"
        v-model:page="state.deferred.page"
        :entity="state.deferred.entity"
        :requester="requester"
        :direct-query="false"
        :edit-fields="true"
        user-timezone="Europe/Paris"
      />
    </div>

    <!-- Minimal -->
    <div v-if="activeTab === 'minimal'">
      <p class="playground-description">
        Stripped-down UI: no operators, no undo/redo/reset, no column editor, no result count.
      </p>
      <QkitSearch
        v-model:fields="state.minimal.fields"
        v-model:sort="state.minimal.sort"
        v-model:filter="state.minimal.filter"
        v-model:page="state.minimal.page"
        :entity="state.minimal.entity"
        :requester="requester"
        :display-operator="false"
        :allow-reset="false"
        :allow-undo="false"
        :allow-redo="false"
        :edit-fields="false"
        :display-count="false"
      />
    </div>

    <!-- Restricted -->
    <div v-if="activeTab === 'restricted'">
      <p class="playground-description">
        Only a few properties, one scope, and two operators (= and &lt;&gt;) are allowed.
      </p>
      <QkitSearch
        v-model:fields="state.restricted.fields"
        v-model:sort="state.restricted.sort"
        v-model:filter="state.restricted.filter"
        v-model:page="state.restricted.page"
        :entity="state.restricted.entity"
        :requester="requester"
        :allowed-properties="{ user: ['first_name', 'last_name', 'age', 'gender'], organization: ['brand_name'] }"
        :allowed-scopes="{ user: ['scope'] }"
        :allowed-operators="{ condition: { basic: ['=', '<>'] }, group: ['and'] }"
        :edit-fields="true"
        user-timezone="Europe/Paris"
      />
    </div>

    <!-- Clicks -->
    <div v-if="activeTab === 'clicks'">
      <p class="playground-description">Click a row or the company cell to see the event data below.</p>
      <QkitSearch
        v-model:fields="state.clicks.fields"
        v-model:sort="state.clicks.sort"
        v-model:filter="state.clicks.filter"
        v-model:page="state.clicks.page"
        :entity="state.clicks.entity"
        :requester="requester"
        :on-item-click="onItemClick"
        :custom-fields="{ company: { onFieldClick: onFieldClick } }"
      />
      <div style="display: flex; gap: 1rem; margin-top: 0.75rem">
        <div v-if="clickedRow" class="playground-panel" style="flex: 1">
          <strong>Row clicked</strong>
          <pre>{{ JSON.stringify(clickedRow, null, 2) }}</pre>
        </div>
        <div v-if="clickedCell" class="playground-panel" style="flex: 1">
          <strong>Cell clicked: {{ clickedCell.fieldId }}</strong>
          <pre>{{ JSON.stringify(clickedCell.value, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <!-- Embedded actions -->
    <div v-if="activeTab === 'embedded'">
      <p class="playground-description">
        Actions (undo/redo/reset) are rendered inside the FilterBuilder's group action bar instead of a header.
      </p>
      <QkitSearch
        v-model:fields="state.embedded.fields"
        v-model:sort="state.embedded.sort"
        v-model:filter="state.embedded.filter"
        v-model:page="state.embedded.page"
        :entity="state.embedded.entity"
        :requester="requester"
        :edit-fields="true"
        actions-location="embedded"
        user-timezone="Europe/Paris"
      />
    </div>

    <!-- Fixed -->
    <div v-if="activeTab === 'fixed'">
      <p class="playground-description">
        Filter structure is fixed: conditions cannot be added or removed, only values can be changed.
      </p>
      <QkitSearch
        v-model:fields="state.fixed.fields"
        v-model:sort="state.fixed.sort"
        v-model:filter="state.fixed.filter"
        v-model:page="state.fixed.page"
        :entity="state.fixed.entity"
        :requester="requester"
        user-timezone="Europe/Paris"
      />
    </div>

    <div class="playground-displays">
      <RequestDisplay :request="currentState.filter" title="Filter" />
      <RequestDisplay :request="currentState.sort" title="Sort" />
      <RequestDisplay :request="currentState.fields" title="Fields" />
      <RequestDisplay :request="lastRequest" title="Request" />
    </div>
  </div>
</template>
