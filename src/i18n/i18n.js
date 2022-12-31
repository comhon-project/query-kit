import { reactive, ref, shallowRef, watch } from "vue";
import en from "./locales/en";

// set english as default language
const locales = ref({ en });
const translations = shallowRef(locales.value.en);
const locale = ref('en');

const reactiveLocales = reactive({});

async function loadLocale() {
    const value = await import(`./locales/${locale.value}`);
    locales.value[locale.value] = value.default;
}

watch(locale, async () => {
    try {
        if (!locales.value[locale.value]) {
            await loadLocale();
        }
        translations.value = locales.value[locale.value];
        for (const key in reactiveLocales) {
            if (Object.hasOwnProperty.call(reactiveLocales, key)) {
                reactiveLocales[key] = translation(key);
            }
        }
    } catch (error) {
        locale.value = 'en';
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
    translations,
    translate
}