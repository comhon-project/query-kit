import { reactive, watch } from 'vue';
import { fallback, locale } from '@i18n/i18n';

let schemaLoader;
let schemaLocaleLoader;
const computedSchemas = {};
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

function ensureTranslationsLoaded(schemaId) {
  const cacheKey = `${schemaId}.${locale.value}`;
  if (!loadedTranslations[cacheKey] && !loadingTranslations[cacheKey] && schemaLocaleLoader) {
    loadingTranslations[cacheKey] = true;
    loadRawTranslations(schemaId, locale.value);
  }
}

function getPropertyTranslationForLocale(property, targetLocale) {
  const current = loadedTranslations[`${property.owner}.${targetLocale}`];
  if (current?.[property.id]) return current[property.id];

  const fallbackTranslations = loadedTranslations[`${property.owner}.${fallback.value}`];
  if (fallbackTranslations?.[property.id]) return fallbackTranslations[property.id];

  return property.name;
}

function getPropertyTranslation(property) {
  ensureTranslationsLoaded(property.owner);

  const cacheKey = `${property.owner}.${locale.value}`;
  const targetLocale = loadingTranslations[cacheKey] ? previousLocale : locale.value;

  return getPropertyTranslationForLocale(property, targetLocale);
}

function getEnumTranslationForLocale(property, enumKey, targetLocale) {
  const current = loadedTranslations[`${property.owner}.${targetLocale}`];
  const currentValue = current?.__enumerations__?.[property.id]?.[enumKey];
  if (currentValue) return currentValue;

  const fallbackTranslations = loadedTranslations[`${property.owner}.${fallback.value}`];
  const fallbackValue = fallbackTranslations?.__enumerations__?.[property.id]?.[enumKey];
  if (fallbackValue) return fallbackValue;

  const enumDef = property.enum;
  return enumDef?.[enumKey] ?? enumKey;
}

function getEnumTranslation(property, enumKey) {
  ensureTranslationsLoaded(property.owner);

  const cacheKey = `${property.owner}.${locale.value}`;
  const targetLocale = loadingTranslations[cacheKey] ? previousLocale : locale.value;

  return getEnumTranslationForLocale(property, enumKey, targetLocale);
}

function getEnumTranslations(property, enumDef = property.enum) {
  const enumKeys = Array.isArray(enumDef) ? enumDef : Object.keys(enumDef);
  const result = {};
  for (const key of enumKeys) {
    result[key] = getEnumTranslation(property, key);
  }
  return result;
}

async function compute(id) {
  const translationPromises = [];
  if (schemaLocaleLoader) {
    translationPromises.push(loadRawTranslations(id, locale.value));
    if (locale.value !== fallback.value) {
      translationPromises.push(loadRawTranslations(id, fallback.value));
    }
  }

  const [loadedSchema] = await Promise.all([schemaLoader.load(id), ...translationPromises]);
  const schema = structuredClone(loadedSchema);

  if (!schema) return null;

  const mapProperties = {};
  const mapScopes = {};

  for (const property of schema.properties) {
    property.owner = id;
    mapProperties[property.id] = property;
  }

  if (schema.search?.scopes && Array.isArray(schema.search.scopes)) {
    const scopes = [];
    for (let current of schema.search.scopes) {
      const scope = typeof current == 'object' ? current : { id: current, name: current };
      scope.owner = id;
      mapScopes[scope.id] = scope;
      scopes.push(scope);
    }
    schema.search.scopes = scopes;
  }

  schema.mapProperties = mapProperties;
  schema.mapScopes = mapScopes;
  schema.id = id;

  return schema;
}

async function loadRawTranslations(schemaId, targetLocale) {
  const cacheKey = `${schemaId}.${targetLocale}`;
  if (!loadedTranslations[cacheKey]) {
    try {
      loadedTranslations[cacheKey] = await schemaLocaleLoader.load(schemaId, targetLocale);
    } catch {
      loadedTranslations[cacheKey] = {};
    }
    delete loadingTranslations[cacheKey];
  }
  return loadedTranslations[cacheKey];
}

async function getPropertyPath(schemaId, nestedProperty) {
  const propertyPath = [];
  const splited = nestedProperty.split('.');
  let propertyName = '';
  let currentSchema = await resolve(schemaId);
  for (let i = 0; i < splited.length - 1; i++) {
    propertyName = propertyName.length ? `${propertyName}.${splited[i]}` : splited[i];
    const property = currentSchema.mapProperties[propertyName];
    if (!property) {
      continue;
    }
    propertyPath.push(property);
    currentSchema = await resolve(property.model);
    if (!currentSchema) {
      throw new Error(`invalid schema id "${property.schemaId}"`);
    }
    propertyName = '';
  }
  const last = splited[splited.length - 1];
  propertyName = propertyName.length ? `${propertyName}.${last}` : last;
  if (!currentSchema.mapProperties[propertyName]) {
    throw new Error(`invalid collection property "${nestedProperty}"`);
  }
  propertyPath.push(currentSchema.mapProperties[propertyName]);
  return propertyPath;
}

const registerLoader = (config) => {
  schemaLoader = config;
};

const registerLocaleLoader = (config) => {
  schemaLocaleLoader = config;
};

const resolve = (id) => {
  if (!computedSchemas[id]) {
    computedSchemas[id] = compute(id);
  }
  return computedSchemas[id];
};

export {
  registerLoader,
  registerLocaleLoader,
  resolve,
  getPropertyPath,
  getPropertyTranslation,
  getEnumTranslation,
  getEnumTranslations,
  loadRawTranslations,
};
