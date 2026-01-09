import { reactive, ref, watch, type Ref } from 'vue';
import en from '@i18n/locales/en';

export type Translations = Record<string, string>;

const locale: Ref<string> = ref('en');
const fallback: Ref<string> = ref('en');

const loadedTranslations: Record<string, Translations> = reactive({ en });
const loadingTranslations: Record<string, boolean> = {};
let previousLocale = 'en';

watch(
  locale,
  (_, oldLocale) => {
    previousLocale = oldLocale;
  },
  { flush: 'sync' },
);

function ensureTranslationsLoaded(): void {
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

async function loadRawTranslations(targetLocale: string): Promise<Translations> {
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

function getTranslationForLocale(key: string, targetLocale: string): string {
  const translations = loadedTranslations[targetLocale];
  if (translations?.[key]) return translations[key];

  const fallbackTranslations = loadedTranslations[fallback.value];
  if (fallbackTranslations?.[key]) return fallbackTranslations[key];

  return key;
}

const translate = (key: string | undefined): string | undefined => {
  if (key === undefined) {
    return undefined;
  }
  ensureTranslationsLoaded();

  const targetLocale = loadingTranslations[locale.value] ? previousLocale : locale.value;
  return getTranslationForLocale(key, targetLocale);
};

export { locale, fallback, translate, loadedTranslations };
