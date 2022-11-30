<script setup>
import { ref, provide, toRaw } from 'vue'
import Search from './components/Search.vue'
import { locale } from './i18n/i18n';

const theme = provide('theme', {
  color_primary: '#7457c4',
  color_secondary: '#c45757'
});
const model = ref('user');
const properties = ref([
  {
    'id': 'first_name',
    'label': 'override first name', 
  },
  'last_name',
  {
    'id': 'company.brand_name',
    'label': 'override brand name',
  },
  'company.address'
]);
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
      operator: '=',
      value: 'one',
      editable: false,
    },
    {
      type: 'condition',
      property: 'first_name',
      value: '%azeaze%',
      operator: 'like',
      removable: false,
    },
    {
      type: 'condition',
      property: 'birth_date',
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
      property: 'gender',
      operator: '<>',
      value: 'female'
    },
    {
      type: 'scope',
      id: 'enum_scope',
      value: 'two'
    },
    {
      type: 'scope',
      id: 'quick_search',
      operator: '=',
      value: 'twozzzz'
    },
    {
      type: 'condition',
      property: 'countries',
      operator: 'in',
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
                },
                {
                  type: 'condition',
                  property: 'first_name',
                  operator: '=',
                },
              ]
            },
          },
        },
      ]
    }
  ]
};
const filter = ref(group);

// TODO locales for schema properties and scopes
// collection

</script>

<template>
  <div class="root-app">
    <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; justify-content: end;">
      <button @click="() => locale = 'fr'" class="qkit-btn qkit-btn-primary"> fr </button>
      <button @click="() => locale = 'en'" class="qkit-btn qkit-btn-primary"> en </button>
    </div>
    <Search 
      :model="model" 
      :properties="properties" 
      :filter="filter"
      :allowed-properties="{user: null}"
      :allowed-scopes="{user: null}"
      :allowed-operators="{ scope: null, group: ['or'], relationship_condition: null}"
      :allowReset="true"
      user-timezone="Europe/Paris"
      :display-operator="true"
      :deferred="500"
      :manually="true"
      :direct-query="true"
      :computed-scopes="{user: [
        {id: 'quick_search', name: 'quick search user', type: 'string', useOperator: true, computed: (value, operator) => {
          return {type: 'group', operator: 'or', filters: [
            {
              property: 'first_name',
              operator: operator,
              value: value,
            },
            {
              property: 'last_name',
              operator: operator,
              value: value,
            }
          ]}
        }},
      ], organization: [
        {id: 'quick_search', name: 'quick search company'},
      ]}"
    />
  </div>
</template>