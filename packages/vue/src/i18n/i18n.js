import { reactive, ref, watch } from 'vue';
import en from '@i18n/locales/en';

const locale = ref('en');
const fallback = ref('en');

const loadedTranslations = reactive({ en });
const loadingTranslations = {};
let previousLocale = 'en';

watch(
  locale,
  (_, oldLocale) => {
    previousLocale = oldLocale;
  },
  { flush: 'sync' },
);

function ensureTranslationsLoaded() {
  const targetLocale = locale.value;
  if (!loadedTranslations[targetLocale] && !loadingTranslations[targetLocale]) {
    loadingTranslations[targetLocale] = true;
    loadRawTranslations(targetLocale);
  }
  const fallbackLocale = fallback.value;
  if (fallbackLocale !== targetLocale && !loadedTranslations[fallbackLocale] && !loadingTranslations[fallbackLocale]) {
    loadingTranslations[fallbackLocale] = true;
    loadRawTranslations(fallbackLocale);
  }
}

async function loadRawTranslations(targetLocale) {
  if (!loadedTranslations[targetLocale]) {
    try {
      const value = await import(`./locales/${targetLocale}.js`);
      loadedTranslations[targetLocale] = value.default;
    } catch {
      if (targetLocale === fallback.value) {
        fallback.value = 'en';
      }
      loadedTranslations[targetLocale] = {};
    }
    delete loadingTranslations[targetLocale];
  }
  return loadedTranslations[targetLocale];
}

function getTranslationForLocale(key, targetLocale) {
  const translations = loadedTranslations[targetLocale];
  if (translations?.[key]) return translations[key];

  const fallbackTranslations = loadedTranslations[fallback.value];
  if (fallbackTranslations?.[key]) return fallbackTranslations[key];

  return key;
}

const translate = (key) => {
  if (key === undefined) {
    return undefined;
  }
  ensureTranslationsLoaded();

  const targetLocale = loadingTranslations[locale.value] ? previousLocale : locale.value;
  return getTranslationForLocale(key, targetLocale);
};

export { locale, fallback, translate, loadedTranslations };
