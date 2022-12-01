import { locale, locales } from "../i18n/i18n";
import { registerClasses } from "./ClassManager";
import { registerIcons } from "./IconManager";
import { registerComponents } from "./InputManager";


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
        if (options.locales) {
            locales.value = options.locales;
        }
        if (options.locale) {
            locale.value = options.locale;
        }
        if (!locales.value[locale.value]) {
            throw new Error('invalid locale '+locale.value);
        }
        if (options.requester) {
            const requester = typeof options.requester == 'function'
                ? {request: options.requester} : options.requester;
            if (typeof requester != 'object' || typeof requester.request != 'function') {
                throw new Error('invalid requester. it must be a function or an object containing a property "request" with a function value');
            }
            app.provide(Symbol.for('requester'), requester);
        }
    }
}