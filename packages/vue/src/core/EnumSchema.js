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
    mapCases[caseItem.id] = caseItem;
  }

  enumSchema.mapCases = mapCases;

  return enumSchema;
}

function getCaseTranslationForLocale(enumId, caseId, targetLocale) {
  const current = loadedTranslations[`${enumId}.${targetLocale}`];
  if (current?.[caseId]) return current[caseId];

  const fallbackTranslations = loadedTranslations[`${enumId}.${fallback.value}`];
  if (fallbackTranslations?.[caseId]) return fallbackTranslations[caseId];

  return computedEnums[enumId]?.mapCases?.[caseId]?.name ?? caseId;
}

function getTranslation(enumId, caseId) {
  ensureTranslationsLoaded(enumId);

  const cacheKey = `${enumId}.${locale.value}`;
  const targetLocale = loadingTranslations[cacheKey] ? previousLocale : locale.value;

  return getCaseTranslationForLocale(enumId, caseId, targetLocale);
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
