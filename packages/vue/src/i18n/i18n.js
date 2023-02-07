import { reactive, ref, shallowRef, watch } from 'vue';
import en from './locales/en';

// set english as default language
const locales = ref({ en });
const translations = shallowRef(locales.value.en);
const locale = ref('en');
const fallback = ref('en');

const reactiveLocales = reactive({});

async function loadLocale() {
  const value = await import(`./locales/${locale.value}.js`);
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
    if (locale.value == fallback.value) {
      // if locale and fallback config are invalid (translation doesn't exists)
      // we set the fallback to a trusted value
      fallback.value = 'en';
    }
    locale.value = fallback.value;
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
};

const translate = (key) => {
  if (!reactiveLocales[key]) {
    reactiveLocales[key] = translation(key);
  }
  return reactiveLocales[key];
};

export { locale, fallback, translations, translate };
