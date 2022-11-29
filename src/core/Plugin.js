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
    }
}