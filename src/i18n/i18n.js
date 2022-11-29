import { reactive, ref, watch } from "vue";
import en from "./locales/en";

// set english as default language
const locales = ref({ en });
const locale = ref('en');

const reactiveLocales = reactive({});

watch(locale, () => {
    if (!locales.value[locale.value]) {
        throw new Error('invalid locale '+locale.value);
    }
    for (const key in reactiveLocales) {
        if (Object.hasOwnProperty.call(reactiveLocales, key)) {
            reactiveLocales[key] = translation(key);
        }
    }
});

const translation = (key) => {
    if (key == undefined) {
        return undefined;
    }
    return key.split('.').reduce((current, localeKey) => {
        if (current) {
            return current[localeKey];
        }
    }, locales.value[locale.value]);
}

const translate = (key) => {
    if (!reactiveLocales[key]) {
        reactiveLocales[key] = translation(key);
    }
    return reactiveLocales[key];
}

export {
    locale,
    locales,
    translate
}