import { createApp } from "vue";
import App from "./App.vue";

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
    }
}).mount("#app");
