import { reactive, watch } from 'vue';
import { fallback, locale } from '@i18n/i18n';

// Raw types - before compute()
export interface RawEnumCase {
  id: string;
  name?: string;
}

export interface RawEnumSchema {
  cases: RawEnumCase[];
}

// Computed types - after compute()
export interface EnumCase extends RawEnumCase {
  owner: string;
}

export interface EnumSchema {
  cases: EnumCase[];
  mapCases: Record<string, EnumCase>;
}

export interface EnumSchemaLoader {
  load: (id: string) => Promise<RawEnumSchema | null>;
}

export interface EnumTranslationsLoader {
  load: (enumId: string, locale: string) => Promise<Record<string, string> | null>;
}

let schemaLoader: EnumSchemaLoader | undefined;
let translationsLoader: EnumTranslationsLoader | undefined;
const computedEnums: Record<string, Promise<EnumSchema>> = {};
const loadedTranslations: Record<string, Record<string, string> | null> = reactive({});
const loadingTranslations: Record<string, boolean> = {};
let previousLocale = locale.value;

watch(
  locale,
  (_, oldLocale) => {
    previousLocale = oldLocale;
  },
  { flush: 'sync' },
);

function ensureTranslationsLoaded(enumId: string): void {
  const cacheKey = `${enumId}.${locale.value}`;
  if (!loadedTranslations[cacheKey] && !loadingTranslations[cacheKey] && translationsLoader) {
    loadingTranslations[cacheKey] = true;
    loadRawTranslations(enumId, locale.value);
  }
}

async function loadRawTranslations(enumId: string, targetLocale: string): Promise<Record<string, string>> {
  if (!translationsLoader) {
    throw new Error('Enum translations loader not configured');
  }
  const cacheKey = `${enumId}.${targetLocale}`;
  if (!loadedTranslations[cacheKey]) {
    try {
      loadedTranslations[cacheKey] = await translationsLoader.load(enumId, targetLocale);
    } catch {
      loadedTranslations[cacheKey] = {};
    }
    delete loadingTranslations[cacheKey];
  }
  return loadedTranslations[cacheKey] ?? {};
}

async function compute(id: string): Promise<EnumSchema> {
  if (!schemaLoader) {
    throw new Error('Enum schema loader not configured');
  }
  const translationPromises: Promise<Record<string, string>>[] = [];
  if (translationsLoader) {
    translationPromises.push(loadRawTranslations(id, locale.value));
    if (locale.value !== fallback.value) {
      translationPromises.push(loadRawTranslations(id, fallback.value));
    }
  }

  const [rawEnum] = await Promise.all([schemaLoader.load(id), ...translationPromises]);

  if (!rawEnum) throw new Error(`Enum schema "${id}" not found`);

  const cases: EnumCase[] = [];
  const mapCases: Record<string, EnumCase> = {};

  for (const rawCase of rawEnum.cases) {
    const enumCase: EnumCase = { ...structuredClone(rawCase), owner: id };
    cases.push(enumCase);
    mapCases[enumCase.id] = enumCase;
  }

  return { cases, mapCases };
}

function getCaseTranslationForLocale(enumCase: EnumCase, targetLocale: string): string {
  const current = loadedTranslations[`${enumCase.owner}.${targetLocale}`];
  if (current?.[enumCase.id]) return current[enumCase.id];

  const fallbackTranslations = loadedTranslations[`${enumCase.owner}.${fallback.value}`];
  if (fallbackTranslations?.[enumCase.id]) return fallbackTranslations[enumCase.id];

  return enumCase.name ?? enumCase.id;
}

function getTranslation(enumCase: EnumCase): string {
  ensureTranslationsLoaded(enumCase.owner);

  const cacheKey = `${enumCase.owner}.${locale.value}`;
  const targetLocale = loadingTranslations[cacheKey] ? previousLocale : locale.value;

  return getCaseTranslationForLocale(enumCase, targetLocale);
}

async function getCases(enumId: string): Promise<EnumCase[]> {
  const enumSchema = await resolve(enumId);
  return enumSchema.cases;
}

const registerLoader = (config: EnumSchemaLoader): void => {
  schemaLoader = config;
};

const registerTranslationsLoader = (config: EnumTranslationsLoader): void => {
  translationsLoader = config;
};

const resolve = (id: string): Promise<EnumSchema> => {
  if (!computedEnums[id]) {
    computedEnums[id] = compute(id);
  }
  return computedEnums[id];
};

export { registerLoader, registerTranslationsLoader, resolve, getCases, getTranslation };
