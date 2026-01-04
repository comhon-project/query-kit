import { reactive, watch } from 'vue';
import { fallback, locale } from '@i18n/i18n';

let schemaLoader;
let translationsLoader;
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
  if (!loadedTranslations[cacheKey] && !loadingTranslations[cacheKey] && translationsLoader) {
    loadingTranslations[cacheKey] = true;
    loadRawTranslations(schemaId, locale.value);
  }
}

function getPropertyTranslationForLocale(property, targetLocale) {
  const current = loadedTranslations[`${property.owner}.${targetLocale}`];
  if (current?.properties?.[property.id]) return current.properties[property.id];

  const fallbackTranslations = loadedTranslations[`${property.owner}.${fallback.value}`];
  if (fallbackTranslations?.properties?.[property.id]) return fallbackTranslations.properties[property.id];

  return property.name ?? property.id;
}

function getScopeTranslationForLocale(scope, targetLocale) {
  const current = loadedTranslations[`${scope.owner}.${targetLocale}`];
  if (current?.scopes?.[scope.id]) return current.scopes[scope.id];

  const fallbackTranslations = loadedTranslations[`${scope.owner}.${fallback.value}`];
  if (fallbackTranslations?.scopes?.[scope.id]) return fallbackTranslations.scopes[scope.id];

  return scope.name ?? scope.id;
}

function getScopeTranslation(scope) {
  ensureTranslationsLoaded(scope.owner);

  const cacheKey = `${scope.owner}.${locale.value}`;
  const targetLocale = loadingTranslations[cacheKey] ? previousLocale : locale.value;

  return getScopeTranslationForLocale(scope, targetLocale);
}

function getPropertyTranslation(property) {
  ensureTranslationsLoaded(property.owner);

  const cacheKey = `${property.owner}.${locale.value}`;
  const targetLocale = loadingTranslations[cacheKey] ? previousLocale : locale.value;

  return getPropertyTranslationForLocale(property, targetLocale);
}

function getParameterTranslationForLocale(schemaId, scopeId, parameterId, targetLocale) {
  const current = loadedTranslations[`${schemaId}.${targetLocale}`];
  if (current?.parameters?.[scopeId]?.[parameterId]) {
    return current.parameters[scopeId][parameterId];
  }

  const fallbackTranslations = loadedTranslations[`${schemaId}.${fallback.value}`];
  if (fallbackTranslations?.parameters?.[scopeId]?.[parameterId]) {
    return fallbackTranslations.parameters[scopeId][parameterId];
  }

  return null;
}

function getScopeParameterTranslation(schemaId, scopeId, parameter) {
  ensureTranslationsLoaded(schemaId);

  const cacheKey = `${schemaId}.${locale.value}`;
  const targetLocale = loadingTranslations[cacheKey] ? previousLocale : locale.value;

  return getParameterTranslationForLocale(schemaId, scopeId, parameter.id, targetLocale) ?? parameter.name ?? parameter.id;
}

async function compute(id) {
  const translationPromises = [];
  if (translationsLoader) {
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

  if (schema.scopes && Array.isArray(schema.scopes)) {
    for (let current of schema.scopes) {
      const scope = typeof current == 'object' ? current : { id: current, name: current };
      scope.owner = id;
      mapScopes[scope.id] = scope;
    }
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
      loadedTranslations[cacheKey] = await translationsLoader.load(schemaId, targetLocale);
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
    currentSchema = await resolve(property.related);
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

const registerTranslationsLoader = (config) => {
  translationsLoader = config;
};

const resolve = (id) => {
  if (!computedSchemas[id]) {
    computedSchemas[id] = compute(id);
  }
  return computedSchemas[id];
};

export {
  registerLoader,
  registerTranslationsLoader,
  resolve,
  getPropertyPath,
  getPropertyTranslation,
  getScopeTranslation,
  getScopeParameterTranslation,
  loadRawTranslations,
};
