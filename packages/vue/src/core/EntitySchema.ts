import { reactive, watch } from 'vue';
import { fallback, locale } from '@i18n/i18n';

export interface TypeContainer {
  type: string;
  enum?: string;
}

export interface ArrayableTypeContainer extends TypeContainer {
  children?: ArrayableTypeContainer;
}

// Raw types - before compute()
export interface RawScopeParameter extends ArrayableTypeContainer {
  id: string;
  name?: string;
  nullable?: boolean;
}

export interface RawScope {
  id: string;
  name?: string;
  parameters?: RawScopeParameter[];
}

export interface RawProperty extends ArrayableTypeContainer {
  id: string;
  name?: string;
  related?: string;
}

export interface RawEntitySchema {
  properties: RawProperty[];
  scopes?: (string | RawScope)[];
}

// Computed types - after compute()
export interface ScopeParameter extends ArrayableTypeContainer {
  id: string;
  name?: string;
  nullable?: boolean;
}

export interface Scope {
  id: string;
  name?: string;
  owner: string;
  parameters?: ScopeParameter[];
}

export interface Property extends ArrayableTypeContainer {
  id: string;
  name?: string;
  owner: string;
  related?: string;
}

export interface EntitySchema {
  id: string;
  properties: Property[];
  scopes?: Scope[];
  mapProperties: Record<string, Property>;
  mapScopes: Record<string, Scope>;
}

export interface EntityTranslations {
  properties?: Record<string, string>;
  scopes?: Record<string, string>;
  parameters?: Record<string, Record<string, string>>;
}

export interface EntitySchemaLoader {
  load: (id: string) => Promise<RawEntitySchema | null>;
}

export interface EntityTranslationsLoader {
  load: (schemaId: string, locale: string) => Promise<EntityTranslations | null>;
}

let schemaLoader: EntitySchemaLoader | undefined;
let translationsLoader: EntityTranslationsLoader | undefined;
const computedSchemas: Record<string, Promise<EntitySchema | null>> = {};
const loadedTranslations: Record<string, EntityTranslations | null> = reactive({});
const loadingTranslations: Record<string, boolean> = {};
let previousLocale = locale.value;

watch(
  locale,
  (_, oldLocale) => {
    previousLocale = oldLocale;
  },
  { flush: 'sync' },
);

function ensureTranslationsLoaded(schemaId: string): void {
  const cacheKey = `${schemaId}.${locale.value}`;
  if (!loadedTranslations[cacheKey] && !loadingTranslations[cacheKey] && translationsLoader) {
    loadingTranslations[cacheKey] = true;
    loadRawTranslations(schemaId, locale.value);
  }
}

function getPropertyTranslationForLocale(property: Property, targetLocale: string): string {
  const current = loadedTranslations[`${property.owner}.${targetLocale}`];
  if (current?.properties?.[property.id]) return current.properties[property.id];

  const fallbackTranslations = loadedTranslations[`${property.owner}.${fallback.value}`];
  if (fallbackTranslations?.properties?.[property.id]) return fallbackTranslations.properties[property.id];

  return property.name ?? property.id;
}

function getScopeTranslationForLocale(scope: Scope, targetLocale: string): string {
  const current = loadedTranslations[`${scope.owner}.${targetLocale}`];
  if (current?.scopes?.[scope.id]) return current.scopes[scope.id];

  const fallbackTranslations = loadedTranslations[`${scope.owner}.${fallback.value}`];
  if (fallbackTranslations?.scopes?.[scope.id]) return fallbackTranslations.scopes[scope.id];

  return scope.name ?? scope.id;
}

function getScopeTranslation(scope: Scope): string {
  ensureTranslationsLoaded(scope.owner);

  const cacheKey = `${scope.owner}.${locale.value}`;
  const targetLocale = loadingTranslations[cacheKey] ? previousLocale : locale.value;

  return getScopeTranslationForLocale(scope, targetLocale);
}

function getPropertyTranslation(property: Property): string {
  ensureTranslationsLoaded(property.owner);

  const cacheKey = `${property.owner}.${locale.value}`;
  const targetLocale = loadingTranslations[cacheKey] ? previousLocale : locale.value;

  return getPropertyTranslationForLocale(property, targetLocale);
}

function getParameterTranslationForLocale(
  schemaId: string,
  scopeId: string,
  parameterId: string,
  targetLocale: string,
): string | null {
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

function getScopeParameterTranslation(schemaId: string, scopeId: string, parameter: ScopeParameter): string {
  ensureTranslationsLoaded(schemaId);

  const cacheKey = `${schemaId}.${locale.value}`;
  const targetLocale = loadingTranslations[cacheKey] ? previousLocale : locale.value;

  return getParameterTranslationForLocale(schemaId, scopeId, parameter.id, targetLocale) ?? parameter.name ?? parameter.id;
}

async function compute(id: string): Promise<EntitySchema | null> {
  const translationPromises: Promise<EntityTranslations>[] = [];
  if (translationsLoader) {
    translationPromises.push(loadRawTranslations(id, locale.value));
    if (locale.value !== fallback.value) {
      translationPromises.push(loadRawTranslations(id, fallback.value));
    }
  }

  const [rawSchema] = await Promise.all([schemaLoader!.load(id), ...translationPromises]);

  if (!rawSchema) return null;

  const mapProperties: Record<string, Property> = {};
  const mapScopes: Record<string, Scope> = {};
  const properties: Property[] = [];
  const scopes: Scope[] = [];

  for (const rawProperty of rawSchema.properties) {
    const property: Property = { ...structuredClone(rawProperty), owner: id };
    properties.push(property);
    mapProperties[property.id] = property;
  }

  if (rawSchema.scopes && Array.isArray(rawSchema.scopes)) {
    for (const current of rawSchema.scopes) {
      const scope: Scope =
        typeof current === 'object'
          ? { ...structuredClone(current), owner: id }
          : { id: current, name: current, owner: id };
      scopes.push(scope);
      mapScopes[scope.id] = scope;
    }
  }

  return {
    id,
    properties,
    scopes: scopes.length > 0 ? scopes : undefined,
    mapProperties,
    mapScopes,
  };
}

async function loadRawTranslations(schemaId: string, targetLocale: string): Promise<EntityTranslations> {
  const cacheKey = `${schemaId}.${targetLocale}`;
  if (!loadedTranslations[cacheKey]) {
    try {
      loadedTranslations[cacheKey] = await translationsLoader!.load(schemaId, targetLocale);
    } catch {
      loadedTranslations[cacheKey] = {};
    }
    delete loadingTranslations[cacheKey];
  }
  return loadedTranslations[cacheKey] ?? {};
}

async function getPropertyPath(schemaId: string, nestedProperty: string): Promise<Property[]> {
  const propertyPath: Property[] = [];
  const splited = nestedProperty.split('.');
  let propertyName = '';
  let currentSchema = await resolve(schemaId);
  for (let i = 0; i < splited.length - 1; i++) {
    propertyName = propertyName.length ? `${propertyName}.${splited[i]}` : splited[i];
    const property = currentSchema!.mapProperties![propertyName];
    if (!property) {
      continue;
    }
    propertyPath.push(property);
    currentSchema = await resolve(property.related!);
    if (!currentSchema) {
      throw new Error(`invalid schema id "${property.related}"`);
    }
    propertyName = '';
  }
  const last = splited[splited.length - 1];
  propertyName = propertyName.length ? `${propertyName}.${last}` : last;
  if (!currentSchema!.mapProperties![propertyName]) {
    throw new Error(`invalid collection property "${nestedProperty}"`);
  }
  propertyPath.push(currentSchema!.mapProperties![propertyName]);
  return propertyPath;
}

const registerLoader = (config: EntitySchemaLoader): void => {
  schemaLoader = config;
};

const registerTranslationsLoader = (config: EntityTranslationsLoader): void => {
  translationsLoader = config;
};

const resolve = (id: string): Promise<EntitySchema | null> => {
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
