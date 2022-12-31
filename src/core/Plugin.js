import { locale } from "../i18n/i18n";
import { registerClasses } from "./ClassManager";
import { registerIcons } from "./IconManager";
import { registerComponents } from "./InputManager";
import { registerLoader } from "./Schema";

export default {
    install: (app, options) => {
        if (!options) {
            return;
        }
        if (options.icons) {
            registerIcons(options.icons);
        }
        if (options.classes) {
            registerClasses(options.classes);
        }
        if (options.inputs) {
            registerComponents(options.inputs);
        }
        if (options.locale) {
            locale.value = options.locale;
        }
        if (options.requester) {
            const requester = typeof options.requester == 'function'
                ? {request: options.requester} : options.requester;
            if (typeof requester != 'object' || typeof requester.request != 'function') {
                throw new Error('invalid requester. it must be a function or an object containing a property "request" with a function value');
            }
            app.provide(Symbol.for('requester'), requester);
        }
        if (options.schemaLoader) {
            const loader = typeof options.schemaLoader == 'function'
                ? {load: options.schemaLoader} : options.schemaLoader;
            if (typeof loader != 'object' || typeof loader.load != 'function') {
                throw new Error('invalid schema loader. it must be a function or an object containing a property "load" with a function value');
            }
            registerLoader(loader);
        } else {
            throw new Error('schemaLoader config is required');
        }
    }
}