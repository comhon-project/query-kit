import { createApp } from 'vue';
import App from './App.vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faPlus,
  faXmark,
  faRotateLeft,
  faBackward,
  faForward,
  faChevronDown,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

import './assets/main.css';
import '@query-kit/themes/default';

import { plugin, MultipleCapableComponent } from '@query-kit/vue';

function computeQuickSearch(parameters) {
  const value = parameters[0];
  return {
    type: 'group',
    operator: 'or',
    filters: [
      {
        property: 'first_name',
        operator: 'ilike',
        value: value,
      },
      {
        property: 'last_name',
        operator: 'ilike',
        value: value,
      },
    ],
  };
}
import {
  entitySchemaLoader,
  entityTranslationsLoader,
  enumSchemaLoader,
  enumTranslationsLoader,
  requestSchemaLoader,
} from './core/SchemaLoader';
import { generateRow } from './core/MockDataGenerator';
import CellCountry from './components/CellCountry.vue';
import CountryInput from './components/CountryInput.vue';
import LastNameInput from './components/LastNameInput.vue';

library.add([faPlus, faXmark, faRotateLeft, faBackward, faForward, faChevronDown, faCheck]);

createApp(App)
  .component('Icon', FontAwesomeIcon)
  .component('CountryInput', CountryInput)
  .use(plugin, {
    entitySchemaLoader,
    entityTranslationsLoader,
    enumSchemaLoader,
    enumTranslationsLoader,
    requestSchemaLoader,
    classes: {},
    typeInputs: {
      country: new MultipleCapableComponent(CountryInput),
    },
    propertyInputs: {
      user: {
        last_name: LastNameInput,
      },
    },
    cellTypeRenderers: {
      country: CellCountry,
    },
    cellPropertyRenderers: {
      user: {
        weight: (value) => value + ' kg',
      },
    },
    icons: 'default',
    defaultLocale: 'en',
    fallbackLocale: 'fr',
    renderHtml: true,
    aliasInsensitiveLabels: true,
    operators: {
      condition: {
        basic: [
          '=',
          '<>',
          '<',
          '<=',
          '>',
          '>=',
          'in',
          'not_in',
          'ilike',
          'not_ilike',
          'ibegins_with',
          'idoesnt_begin_with',
          'iends_with',
          'idoesnt_end_with',
          'null',
          'not_null',
        ],
      },
    },
    allowedOperators: {
      condition: {
        country: ['ilike', 'not_in'],
        datetime: ['=', 'not_in'],
        array: ['=', 'in'],
      },
    },
    computedScopes: {
      user: [
        {
          id: 'quick_search',
          translation: (localeValue) => (localeValue == 'fr' ? 'recherche rapide' : 'quick search user'),
          parameters: [{ id: 'value', name: 'value', type: 'string' }],
          computed: computeQuickSearch,
        },
      ],
      organization: [{ id: 'quick_search', name: 'quick search company', parameters: [] }],
    },
    requester: {
      request: (query) => {
        console.log('main-requester');
        console.log(query);
        const lastCompleteBulk = 3;
        const queryLimit = query.limit ?? 20;
        const limit = query.offset > lastCompleteBulk * queryLimit ? queryLimit - 1 : queryLimit;
        const collection = [];
        for (let index = 0; index < limit; index++) {
          collection.push(generateRow(query.entity, query.properties));
        }
        console.log(structuredClone(collection));
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              count: lastCompleteBulk * queryLimit + (queryLimit - 1),
              collection: collection,
              limit: queryLimit,
            });
          }, 200);
        });
      },
    },
  })
  .mount('#app');
