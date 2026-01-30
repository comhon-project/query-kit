<script setup>
import { markRaw, ref, watch } from 'vue';
import CellFirstName from './components/CellFirstName.vue';
import { locale } from '@query-kit/vue';

const entity = ref('user');
const columns = ref([
  'first_name',
  'last_name',
  'weight',
  'age',
  'gender',
  'married',
  'favorite_fruits',
  'birth.birth_date',
  'birth.birth_day',
  'birth.birth_hour',
  'friend',
  'company',
  'company.description',
  'company.address',
  'no_property',
]);

const customColumns = ref({
  first_name: {
    label: 'overrided first name',
    renderer: markRaw(CellFirstName),
  },
  last_name: {
    label: (localeValue) => (localeValue == 'fr' ? 'nom surchargé localisé' : 'name overrided localized'),
  },
  'company.description': {
    onCellClick: (value, row, property, event) => {
      event.stopPropagation();
      console.log('cell click', property);
      console.log(value);
      console.log(row);
    },
  },
  no_property: {
    label: (localeValue) => (localeValue == 'fr' ? 'non propriété' : 'no property'),
    open: true,
    renderer: (cellValue, rowValue) => {
      return rowValue['first_name'] + ' func';
    },
  },
  no_property_two: {
    label: 'no property two',
    open: true,
    order: ['age', 'weight'],
    renderer: (cellValue, rowValue, columnId, locale) => {
      return rowValue['age'] + (locale == 'fr' ? ' ans' : ' years');
    },
  },
});

const orderBy = ref(['first_name']);

const group = {
  type: 'group',
  operator: 'and',
  filters: [
    {
      type: 'condition',
      property: 'last_name',
      operator: 'in',
    },
    {
      type: 'condition',
      property: 'last_name',
      operator: 'in',
      value: ['one', undefined],
      editable: false,
    },
    {
      type: 'condition',
      property: 'last_name',
      operator: '=',
      value: 'one',
      editable: false,
    },
    {
      type: 'condition',
      property: 'first_name',
      value: 'azeaze',
      operator: 'like',
      removable: false,
    },
    {
      type: 'condition',
      property: 'first_name',
      value: 'end',
      operator: 'ends_with',
    },
    {
      type: 'condition',
      property: 'first_name',
      value: 'not_end',
      operator: 'doesnt_end_with',
    },
    {
      type: 'condition',
      property: 'first_name',
      value: 'begin',
      operator: 'begins_with',
    },
    {
      type: 'condition',
      property: 'first_name',
      value: 'not_begin',
      operator: 'doesnt_begin_with',
    },
    {
      type: 'condition',
      property: 'birth.birth_date',
      value: '2022-01-07T03:06:06.000Z',
      operator: '=',
    },
    {
      type: 'condition',
      property: 'age',
      value: '20',
      operator: '<',
    },
    {
      type: 'condition',
      property: 'married',
      value: true,
      operator: '=',
      editable: false,
    },
    {
      type: 'condition',
      property: 'gender',
      operator: '<>',
      value: 'female',
    },
    {
      type: 'scope',
      id: 'enum_scope',
      parameters: ['two'],
    },
    {
      type: 'scope',
      id: 'quick_search',
      parameters: ['twozzzz'],
    },
    {
      type: 'condition',
      property: 'country',
      operator: 'in',
      value: ['3'],
      editable: false,
    },
    {
      type: 'group',
      operator: 'or',
      editable: false,
      filters: [
        {
          type: 'condition',
          property: 'first_name',
          operator: '=',
          value: 'invisible',
          visible: false,
        },
        {
          type: 'relationship_condition',
          operator: 'has',
          property: 'company',
          filter: {
            type: 'condition',
            property: 'address',
            operator: '=',
          },
        },
        {
          type: 'condition',
          property: 'first_name',
          value: 'aaaaaaaaaaa',
          operator: '=',
          editable: false,
        },
        {
          type: 'relationship_condition',
          operator: 'has',
          property: 'company',
          filter: {
            type: 'relationship_condition',
            operator: 'has_not',
            property: 'contacts',
            filter: {
              type: 'group',
              operator: 'or',
              filters: [
                {
                  type: 'condition',
                  property: 'first_name',
                  operator: '=',
                },
                {
                  type: 'condition',
                  property: 'first_name',
                  operator: '=',
                },
                {
                  type: 'condition',
                  property: 'first_name',
                  operator: '=',
                },
                {
                  type: 'condition',
                  property: 'first_name',
                  operator: '=',
                  value: 'plop',
                },
                {
                  type: 'condition',
                  property: 'first_name',
                  operator: '=',
                },
              ],
            },
          },
        },
      ],
    },
  ],
};
const filter = ref(group);

function printRow(object) {
  console.log('row click');
  console.log(object);
}

async function completeCollection(collection) {
  for (const row of collection) {
    if (row['company.description']) {
      // flattened
      row['company.description'] += ' <span style="color: blue">lalala</span>';
    } else if (row.company) {
      // not flattened
      row.company.description += ' <span style="color: blue">lalala</span>';
    }
    if (row['first_name']) {
      row['first_name'] += ' hehe';
    }
  }
}

async function exportResults(newFilter) {
  console.log('export');
  console.log(newFilter);
}

function handleComputedFilters(params) {
  console.log('computed');
  console.log(params);
}

function handleUpdatedFilters(params) {
  console.log('updated');
  console.log(params);
}

let requester = {
  request: (query) => {
    console.log('prop-requester');
    console.log(query);
    const lastCompleteBulk = 10;
    const limit = query.offset > lastCompleteBulk * query.limit ? query.limit - 1 : query.limit;
    const collection = [];
    for (let index = 0; index < limit; index++) {
      const element = {};
      for (const name of query.properties) {
        let leafProperty = name.replaceAll('friend.', '');
        leafProperty = leafProperty.replaceAll('company.', '');
        switch (leafProperty) {
          case 'birth.birth_date':
            element[name] = '2023-01-03T20:45:04Z';
            break;
          case 'birth.birth_day':
            element[name] = '2023-01-03';
            break;
          case 'birth.birth_hour':
            element[name] = '20:45:04';
            break;
          case 'gender':
            element[name] = Math.random() > 0.5 ? 'male' : 'female';
            break;
          case 'married':
            element[name] = Math.random() > 0.5 ? true : false;
            break;
          case 'weight':
          case 'age':
            element[name] = Math.floor(Math.random() * 100);
            break;
          case 'favorite_fruits': {
            const count = Math.floor(Math.random() * 10);
            element[name] = [];
            for (let index = 0; index < count; index++) {
              element[name].push(Math.floor(Math.random() * 3 + 1));
            }
            break;
          }
          default:
            element[name] = name + Math.random().toString(36);
            break;
        }
      }
      collection.push(element);
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          count: lastCompleteBulk * query.limit + (query.limit - 1),
          collection: collection,
        });
      }, 1000);
    });
  },
  flattened: true,
};

watch(columns, () => {
  console.log('------ app watch columns-------');
});

// TODO export dist files and update main file in package.json
// add tests
</script>

<template>
  <div class="root-app">
    <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; justify-content: end; flex-wrap: wrap">
      <button class="qkit-btn qkit-btn-primary" @click="() => (locale = 'en')">en</button>
      <button class="qkit-btn qkit-btn-primary" @click="() => (locale = 'zh')">zh</button>
      <button class="qkit-btn qkit-btn-primary" @click="() => (locale = 'hi')">hi</button>
      <button class="qkit-btn qkit-btn-primary" @click="() => (locale = 'es')">es</button>
      <button class="qkit-btn qkit-btn-primary" @click="() => (locale = 'fr')">fr</button>
      <button class="qkit-btn qkit-btn-primary" @click="() => (locale = 'ar')">ar</button>
      <button class="qkit-btn qkit-btn-primary" @click="() => (locale = 'bn')">bn</button>
      <button class="qkit-btn qkit-btn-primary" @click="() => (locale = 'pt')">pt</button>
      <button class="qkit-btn qkit-btn-primary" @click="() => (locale = 'ru')">ru</button>
      <button class="qkit-btn qkit-btn-primary" @click="() => (locale = 'ja')">ja</button>
      <button class="qkit-btn qkit-btn-primary" @click="() => (locale = 'de')">de</button>
    </div>
    <div style="height: 90vh">
      <QkitSearch
        v-model:order-by="orderBy"
        :entity="entity"
        :columns="columns"
        :filter="filter"
        :allowed-properties="{ user: null }"
        :allowed-scopes="{ user: null }"
        :allowed-operators="{
          group: ['or'],
          relationship_condition: null,
          condition: {
            integer: ['not_null', 'in'],
          },
        }"
        :allow-reset="true"
        user-timezone="Europe/Paris"
        :display-operator="{
          group: true,
          condition: true,
          relationship_condition: true,
        }"
        :deferred="500"
        :manually="true"
        :direct-query="true"
        :limit="20"
        :quick-sort="true"
        :post-request="completeCollection"
        :allowed-collection-types="['infinite', 'pagination']"
        :display-count="true"
        :edit-columns="true"
        :custom-columns="customColumns"
        :requester="requester"
        @row-click="printRow"
        @export="exportResults"
        @updated="handleUpdatedFilters"
        @computed="handleComputedFilters"
      >
        <template #loadings="{ requesting }">
          <div v-show="requesting">loading...</div>
        </template>
      </QkitSearch>
    </div>
  </div>
</template>

<style>
@media (min-width: 1000px) {
  .root-app {
    margin-left: auto;
    margin-right: auto;
    width: 80%;
  }
}
</style>
