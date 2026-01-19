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
  relationship_type?: 'belongs_to' | 'has_one' | 'has_many' | 'belongs_to_many' | 'morph_to' | 'morph_to_many';
}

export interface RawEntitySchema {
  properties: RawProperty[];
  scopes?: (string | RawScope)[];
  unique_identifier?: string;
  primary_identifiers?: string[];
  default_sort?: string[];
}

// Computed types - after compute()
export interface ScopeParameter extends RawScopeParameter {}

export interface Scope extends RawScope {
  owner: string;
}

export interface Property extends RawProperty {
  owner: string;
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

export class EntitySchema {
  constructor(
    readonly id: string,
    readonly properties: Property[],
    readonly mapProperties: Record<string, Property>,
    readonly scopes: Scope[],
    readonly mapScopes: Record<string, Scope>,
    readonly unique_identifier?: string,
    readonly primary_identifiers?: string[],
    readonly default_sort?: string[],
  ) {}

  getProperty(id: string): Property {
    const property = this.mapProperties[id];
    if (!property) throw new Error(`Property "${id}" not found in schema "${this.id}"`);
    return property;
  }

  getScope(id: string): Scope {
    const scope = this.mapScopes[id];
    if (!scope) throw new Error(`Scope "${id}" not found in schema "${this.id}"`);
    return scope;
  }
}

let schemaLoader: EntitySchemaLoader | undefined;
let translationsLoader: EntityTranslationsLoader | undefined;
const computedSchemas: Record<string, Promise<EntitySchema>> = {};
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
  const translation = getParameterTranslationForLocale(schemaId, scopeId, parameter.id, targetLocale);

  return translation ?? parameter.name ?? parameter.id;
}

async function compute(id: string): Promise<EntitySchema> {
  if (!schemaLoader) {
    throw new Error('Entity schema loader not configured');
  }
  const translationPromises: Promise<EntityTranslations>[] = [];
  if (translationsLoader) {
    translationPromises.push(loadRawTranslations(id, locale.value));
    if (locale.value !== fallback.value) {
      translationPromises.push(loadRawTranslations(id, fallback.value));
    }
  }

  const [rawSchema] = await Promise.all([schemaLoader.load(id), ...translationPromises]);

  if (!rawSchema) throw new Error(`Entity schema "${id}" not found`);

  const mapProperties: Record<string, Property> = {};
  const mapScopes: Record<string, Scope> = {};
  const properties: Property[] = [];
  const scopes: Scope[] = [];

  for (const rawProperty of rawSchema.properties) {
    if (rawProperty.relationship_type === 'morph_to') continue;
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

  return new EntitySchema(
    id,
    properties,
    mapProperties,
    scopes,
    mapScopes,
    rawSchema.unique_identifier,
    rawSchema.primary_identifiers,
    rawSchema.default_sort,
  );
}

async function loadRawTranslations(schemaId: string, targetLocale: string): Promise<EntityTranslations> {
  if (!translationsLoader) {
    throw new Error('Entity translations loader not configured');
  }
  const cacheKey = `${schemaId}.${targetLocale}`;
  if (!loadedTranslations[cacheKey]) {
    try {
      loadedTranslations[cacheKey] = await translationsLoader.load(schemaId, targetLocale);
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
    const property = currentSchema.mapProperties[propertyName];
    if (!property) {
      continue;
    }
    if (!property.related) {
      throw new Error(`Property "${propertyName}" has no related schema`);
    }
    propertyPath.push(property);
    currentSchema = await resolve(property.related);
    propertyName = '';
  }
  const last = splited[splited.length - 1];
  propertyName = propertyName.length ? `${propertyName}.${last}` : last;
  const finalProperty = currentSchema.mapProperties[propertyName];
  if (!finalProperty) {
    throw new Error(`Property "${nestedProperty}" not found in schema "${currentSchema.id}"`);
  }
  propertyPath.push(finalProperty);
  return propertyPath;
}

const registerLoader = (config: EntitySchemaLoader): void => {
  schemaLoader = config;
};

const registerTranslationsLoader = (config: EntityTranslationsLoader): void => {
  translationsLoader = config;
};

const resolve = (id: string): Promise<EntitySchema> => {
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
