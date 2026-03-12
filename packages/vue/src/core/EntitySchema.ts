import { reactive, watch } from 'vue';
import { fallback, locale } from '@i18n/i18n';
import { PropertyNotFoundError } from '@core/errors';
import { getSortableProperties } from '@core/RequestSchema';

export interface TypeContainer {
  type: string;
  enum?: string;
}

export interface ArrayableTypeContainer extends TypeContainer {
  items?: ArrayableTypeContainer;
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
  entity?: string;
}

export interface RawInlineEntitySchema {
  properties: RawProperty[];
  scopes?: (string | RawScope)[];
  unique_identifier?: string;
  primary_identifiers?: string[];
}

export interface RawEntitySchema extends RawInlineEntitySchema {
  default_sort?: string[];
  entities?: Record<string, RawInlineEntitySchema>;
}

// Computed types - after compute()
export interface ScopeParameter extends RawScopeParameter {
  owner: string;
  scopeId: string;
}

export interface Scope extends RawScope {
  owner: string;
  parameters?: ScopeParameter[];
}

export interface Property extends RawProperty {
  owner: string;
}

export interface EntityTranslations {
  properties?: Record<string, string>;
  scopes?: Record<string, string>;
  parameters?: Record<string, Record<string, string>>;
  entities?: Record<string, EntityTranslations>;
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
    if (!property) throw new PropertyNotFoundError(id, this.id);
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

function getScopeParameterTranslation(parameter: ScopeParameter): string {
  ensureTranslationsLoaded(parameter.owner);

  const cacheKey = `${parameter.owner}.${locale.value}`;
  const targetLocale = loadingTranslations[cacheKey] ? previousLocale : locale.value;
  const translation = getParameterTranslationForLocale(parameter.owner, parameter.scopeId, parameter.id, targetLocale);

  return translation ?? parameter.name ?? parameter.id;
}

function buildEntitySchema(
  id: string,
  raw: RawInlineEntitySchema,
): EntitySchema {
  const mapProperties: Record<string, Property> = {};
  const mapScopes: Record<string, Scope> = {};
  const properties: Property[] = [];
  const scopes: Scope[] = [];

  for (const rawProperty of raw.properties) {
    if (rawProperty.relationship_type === 'morph_to') continue;
    const property: Property = { ...structuredClone(rawProperty), owner: id };
    properties.push(property);
    mapProperties[property.id] = property;
  }

  if (raw.scopes && Array.isArray(raw.scopes)) {
    for (const current of raw.scopes) {
      const rawScope = typeof current === 'object' ? structuredClone(current) : { id: current, name: current };
      const parameters: ScopeParameter[] | undefined = rawScope.parameters?.map((param) => ({
        ...param,
        owner: id,
        scopeId: rawScope.id,
      }));
      const scope: Scope = { ...rawScope, owner: id, parameters };
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
    raw.unique_identifier,
    raw.primary_identifiers,
    (raw as RawEntitySchema).default_sort,
  );
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

  const schema = buildEntitySchema(id, rawSchema);

  if (rawSchema.entities) {
    for (const [key, inlineRaw] of Object.entries(rawSchema.entities)) {
      const entityId = `${id}.${key}`;
      if (!computedSchemas[entityId]) {
        computedSchemas[entityId] = Promise.resolve(buildEntitySchema(entityId, inlineRaw));
      }
    }
  }

  return schema;
}

async function loadRawTranslations(schemaId: string, targetLocale: string): Promise<EntityTranslations> {
  if (!translationsLoader) {
    throw new Error('Entity translations loader not configured');
  }
  const cacheKey = `${schemaId}.${targetLocale}`;
  if (!loadedTranslations[cacheKey]) {
    try {
      const translations = await translationsLoader.load(schemaId, targetLocale);
      loadedTranslations[cacheKey] = translations;
      if (translations?.entities) {
        for (const [key, inlineTranslations] of Object.entries(translations.entities)) {
          const entityCacheKey = `${schemaId}.${key}.${targetLocale}`;
          if (!loadedTranslations[entityCacheKey]) {
            loadedTranslations[entityCacheKey] = inlineTranslations;
          }
        }
      }
    } catch {
      loadedTranslations[cacheKey] = {};
    }
    delete loadingTranslations[cacheKey];
  }
  return loadedTranslations[cacheKey] ?? {};
}

async function isPropertySortable(schemaId: string, path: string): Promise<boolean> {
  try {
    const propertyPath = await getPropertyPath(schemaId, path);
    let currentEntity = schemaId;
    for (const property of propertyPath) {
      const sortableProperties = await getSortableProperties(currentEntity);
      if (!sortableProperties.includes(property.id)) {
        return false;
      }
      if (property.type === 'object') {
        currentEntity = property.entity!;
      } else if (property.related) {
        currentEntity = property.related;
      }
    }
    const lastProperty = propertyPath[propertyPath.length - 1];
    const relatedEntityId = lastProperty.relationship_type !== 'morph_to' ? (lastProperty.related ?? lastProperty.entity) : null;
    if (relatedEntityId) {
      const schema = await resolve(relatedEntityId);
      return !!(schema.default_sort || schema.unique_identifier);
    }
    return true;
  } catch {
    return false;
  }
}

async function getPropertyPath(schemaId: string, path: string): Promise<Property[]> {
  const segments = path.split('.');
  const properties: Property[] = [];
  let schema = await resolve(schemaId);

  for (let i = 0; i < segments.length; i++) {
    const property = schema.getProperty(segments[i]);
    properties.push(property);
    if (i < segments.length - 1) {
      if (property.type === 'object') {
        schema = await resolve(property.entity!);
      } else if (property.type === 'relationship' && property.relationship_type !== 'morph_to') {
        schema = await resolve(property.related!);
      } else {
        throw new PropertyNotFoundError(segments[i + 1], schema.id);
      }
    }
  }

  return properties;
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

const getLeafTypeContainer = (container: ArrayableTypeContainer): TypeContainer => {
  while (container.type === 'array' && container.items) {
    container = container.items;
  }
  return container;
};

function _resetForTesting(): void {
  schemaLoader = undefined;
  translationsLoader = undefined;
  for (const key in computedSchemas) delete computedSchemas[key];
  for (const key in loadedTranslations) delete loadedTranslations[key];
  for (const key in loadingTranslations) delete loadingTranslations[key];
  previousLocale = locale.value;
}

export {
  registerLoader,
  registerTranslationsLoader,
  resolve,
  getPropertyPath,
  isPropertySortable,
  getPropertyTranslation,
  getScopeTranslation,
  getScopeParameterTranslation,
  getLeafTypeContainer,
  loadRawTranslations,
  _resetForTesting,
};
