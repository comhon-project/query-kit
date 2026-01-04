import { reactive, watch } from 'vue';
import { fallback, locale } from '@i18n/i18n';

let schemaLoader;
let translationsLoader;
const computedEnums = {};
const loadedTranslations = reactive({});
const loadingTranslations = {};
let previousLocale = locale.value;

watch(
  locale,
  (_, oldLocale) => {
    previousLocale = oldLocale;
  },
  { flush: 'sync' },
);

function ensureTranslationsLoaded(enumId) {
  const cacheKey = `${enumId}.${locale.value}`;
  if (!loadedTranslations[cacheKey] && !loadingTranslations[cacheKey] && translationsLoader) {
    loadingTranslations[cacheKey] = true;
    loadRawTranslations(enumId, locale.value);
  }
}

async function loadRawTranslations(enumId, targetLocale) {
  const cacheKey = `${enumId}.${targetLocale}`;
  if (!loadedTranslations[cacheKey]) {
    try {
      loadedTranslations[cacheKey] = await translationsLoader.load(enumId, targetLocale);
    } catch {
      loadedTranslations[cacheKey] = {};
    }
    delete loadingTranslations[cacheKey];
  }
  return loadedTranslations[cacheKey];
}

async function compute(id) {
  const translationPromises = [];
  if (translationsLoader) {
    translationPromises.push(loadRawTranslations(id, locale.value));
    if (locale.value !== fallback.value) {
      translationPromises.push(loadRawTranslations(id, fallback.value));
    }
  }

  const [loadedEnum] = await Promise.all([schemaLoader.load(id), ...translationPromises]);
  const enumSchema = structuredClone(loadedEnum);

  if (!enumSchema) return null;

  const mapCases = {};
  for (const caseItem of enumSchema.cases) {
    caseItem.owner = id;
    mapCases[caseItem.id] = caseItem;
  }

  enumSchema.mapCases = mapCases;

  return enumSchema;
}

function getCaseTranslationForLocale(enumCase, targetLocale) {
  const current = loadedTranslations[`${enumCase.owner}.${targetLocale}`];
  if (current?.[enumCase.id]) return current[enumCase.id];

  const fallbackTranslations = loadedTranslations[`${enumCase.owner}.${fallback.value}`];
  if (fallbackTranslations?.[enumCase.id]) return fallbackTranslations[enumCase.id];

  return enumCase.name ?? enumCase.id;
}

function getTranslation(enumCase) {
  ensureTranslationsLoaded(enumCase.owner);

  const cacheKey = `${enumCase.owner}.${locale.value}`;
  const targetLocale = loadingTranslations[cacheKey] ? previousLocale : locale.value;

  return getCaseTranslationForLocale(enumCase, targetLocale);
}

async function getCases(enumId) {
  const enumSchema = await resolve(enumId);
  return enumSchema?.cases ?? [];
}

const registerLoader = (config) => {
  schemaLoader = config;
};

const registerTranslationsLoader = (config) => {
  translationsLoader = config;
};

const resolve = (id) => {
  if (!computedEnums[id]) {
    computedEnums[id] = compute(id);
  }
  return computedEnums[id];
};

export { registerLoader, registerTranslationsLoader, resolve, getCases, getTranslation };
