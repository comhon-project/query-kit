import { createApp } from "vue";
import App from "./App.vue";

import "../src/themes/main.css";
import plugin from "./core/Plugin";
import SchemaLoader from "./SchemaLoader";

createApp(App).use(plugin, {
    schemaLoader: SchemaLoader,
    classes: {
        
    },
    inputs: {
        choice: {component: 'number', unique: true}
    },
    icons: {
        delete: 'qkit-icon qkit-icon-cross',
        add: 'qkit-icon qkit-icon-plus',
        add_value: 'qkit-icon qkit-icon-plus',
        close: 'qkit-icon qkit-icon-cross'
    },
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
