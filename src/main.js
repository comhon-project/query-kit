import { createApp } from "vue";
import App from "./App.vue";
import {en, fr} from "./i18n/locales";

import "../src/themes/main.css";
import plugin from "./core/Plugin";

createApp(App).use(plugin, {
    classes: {
        
    },
    inputs: {
        choice: 'number'
    },
    icons: {
        delete: 'qkit-icon qkit-icon-cross',
        add: 'qkit-icon qkit-icon-plus',
        close: 'qkit-icon qkit-icon-cross'
    },
    locales: { en, fr },
    locale: 'fr',
    requester: {
        request: (query) => {
            const lastCompleteBulk = 3;
            const limit = query.offset > lastCompleteBulk* query.limit ? query.limit - 1 : query.limit;
            const collection = [];
            for (let index = 0; index < limit; index++) {
                const element = {};
                for (const name of query.properties) {
                    element[name] = Math.random().toString(36);
                }
                collection.push(element);
            }
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        count: lastCompleteBulk * query.limit + (query.limit - 1),
                        collection: collection
                    });
                }, 1000);
            });
        }
    }
}).mount("#app");
