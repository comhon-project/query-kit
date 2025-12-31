import { createApp } from 'vue';
import App from './App.vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faPlus,
  faXmark,
  faRotateLeft,
  faBackward,
  faForward,
  faArrowDown,
  faChevronDown,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

import '@query-kit/themes/default';

import { plugin } from '@query-kit/vue';
import { schemaLoader, schemaLocaleLoader } from './core/SchemaLoader';
import CellInteger from './components/CellInteger.vue';
import CellDate from './components/CellDate.vue';
import CountryInput from './components/CountryInput.vue';

library.add([faPlus, faXmark, faRotateLeft, faBackward, faForward, faChevronDown, faCheck]);

createApp(App)
  .component('Icon', FontAwesomeIcon)
  .component('CountryInput', CountryInput)
  .use(plugin, {
    schemaLoader: schemaLoader,
    schemaLocaleLoader: schemaLocaleLoader,
    classes: {},
    inputs: {
      choice: { component: 'CountryInput', unique: true },
    },
    cellTypeRenderers: {
      integer: CellInteger,
    },
    cellPropertyRenderers: {
      user: {
        weight: (value) => value + ' kg',
      },
    },
    icons: {
      add: { class: 'qkit-icon qkit-icon-plus', component: 'i' },
      add_filter: { class: 'qkit-icon qkit-icon-plus', component: 'i' },
      add_value: { class: 'qkit-icon qkit-icon-plus', component: 'i' },
      delete: { class: 'qkit-icon qkit-icon-cross', component: 'i' },
      close: { class: 'qkit-icon qkit-icon-cross', component: 'i' },
      previous: { class: 'qkit-icon qkit-icon-double-arrow-left', component: 'i' },
      next: { class: 'qkit-icon qkit-icon-double-arrow-right', component: 'i' },
      collapse: { class: 'qkit-icon qkit-icon-arrow-full-down', component: 'i' },
      down: { class: 'qkit-icon qkit-icon-arrow-full-down', component: 'i' },
      minus: { class: 'qkit-icon qkit-icon-minus', component: 'i' },
      reset: { class: 'qkit-icon qkit-icon-refresh', component: 'i' },
      confirm: { icon: 'fa-solid fa-check', fade: '' },
      next: null,
      search: undefined,
      export: undefined,
      columns: undefined,
    },
    iconComponent: 'Icon',
    iconPropName: 'icon',
    defaultLocale: 'en',
    fallbackLocale: 'fr',
    renderHtml: true,
    allowedOperators: {
      condition: {
        choice: ['like', 'not_in'],
        datetime: ['=', 'not_in'],
        array: ['=', 'in'],
      },
    },
    requester: {
      request: (query) => {
        console.log('main-requester');
        console.log(query);
        const lastCompleteBulk = 3;
        const limit = query.offset > lastCompleteBulk * query.limit ? query.limit - 1 : query.limit;
        const collection = [];
        for (let index = 0; index < limit; index++) {
          const rowObject = {};
          for (const name of query.properties) {
            let container = rowObject;
            let property = name;
            if (name.includes('.')) {
              const list = name.split('.');
              property = list.pop();
              for (const key of list) {
                if (!container[key]) {
                  container[key] = {};
                }
                container = container[key];
              }
            }
            switch (name) {
              case 'birth.birth_date':
                container[property] = '2023-01-03T20:45:04Z';
                break;
              case 'birth.birth_day':
                container[property] = '2023-01-03';
                break;
              case 'birth.birth_hour':
                container[property] = '20:45:04';
                break;
              case 'gender':
                container[property] = Math.random() > 0.5 ? 'male' : 'female';
                break;
              case 'married':
                container[property] = Math.random() > 0.5 ? true : false;
                break;
              case 'age':
                container[property] = Math.floor(Math.random() * 100);
                break;
              case 'favorite_fruits':
                const count = Math.floor(Math.random() * 10);
                container[property] = [];
                for (let index = 0; index < count; index++) {
                  container[property].push(Math.floor(Math.random() * 3 + 1));
                }
                break;
              default:
                container[property] = name + Math.random().toString(36);
                break;
            }
          }
          collection.push(rowObject);
        }
        console.log(structuredClone(collection));
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              count: lastCompleteBulk * query.limit + (query.limit - 1),
              collection: collection,
            });
          }, 1000);
        });
      },
      flattened: false,
    },
  })
  .mount('#app');
