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

import '@query-kit/themes/default';
import './assets/main.css';

import { plugin, InputComponent } from '@query-kit/vue';

import {
  entitySchemaLoader,
  entityTranslationsLoader,
  enumSchemaLoader,
  enumTranslationsLoader,
  requestSchemaLoader,
} from './core/SchemaLoader';
import CountryRenderer from './components/CountryRenderer.vue';
import CountryInput from './components/CountryInput.vue';

library.add([faPlus, faXmark, faRotateLeft, faBackward, faForward, faChevronDown, faCheck]);

function computeQuickSearch(parameters) {
  const value = parameters[0];
  return {
    type: 'group',
    operator: 'or',
    filters: [
      { property: 'first_name', operator: 'ilike', value },
      { property: 'last_name', operator: 'ilike', value },
    ],
  };
}

createApp(App)
  .component('Icon', FontAwesomeIcon)
  .component('CountryInput', CountryInput)
  .use(plugin, {
    entitySchemaLoader,
    entityTranslationsLoader,
    enumSchemaLoader,
    enumTranslationsLoader,
    requestSchemaLoader,
    typeInputs: {
      country: new InputComponent(CountryInput, { multiple: true }),
    },
    fieldTypeRenderers: {
      country: CountryRenderer,
    },
    fieldPropertyRenderers: {
      user: {
        weight: (value) => value + ' kg',
        age: (value, item, propertyPath, locale) => value + (locale === 'fr' ? ' ans' : ' years'),
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
          '=', '<>', '<', '<=', '>', '>=',
          'in', 'not_in',
          'ilike', 'not_ilike',
          'ibegins_with', 'idoesnt_begin_with',
          'iends_with', 'idoesnt_end_with',
          'null', 'not_null',
        ],
        country: ['=', '<>', 'in', 'not_in', 'null', 'not_null'],
      },
    },
    computedScopes: {
      user: [
        {
          id: 'quick_search',
          translation: (locale) => (locale === 'fr' ? 'recherche rapide' : 'quick search'),
          parameters: [{ id: 'value', name: 'value', type: 'string' }],
          computed: computeQuickSearch,
        },
      ],
    },
  })
  .mount('#app');
