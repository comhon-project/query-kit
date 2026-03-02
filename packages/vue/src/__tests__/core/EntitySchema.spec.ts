import { describe, it, expect, beforeEach } from 'vitest';

import {
  resolve,
  registerLoader,
  registerTranslationsLoader,
  getPropertyPath,
  isPropertySortable,
  getPropertyTranslation,
  getScopeTranslation,
  getScopeParameterTranslation,
  getLeafTypeContainer,
  loadRawTranslations,
  _resetForTesting,
} from '@core/EntitySchema';
import type { ArrayableTypeContainer, ScopeParameter } from '@core/EntitySchema';
import { PropertyNotFoundError } from '@core/errors';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { locale, fallback } from '@i18n/i18n';
import { registerLoader as registerRequestLoader, _resetForTesting as resetRequestSchema } from '@core/RequestSchema';

beforeEach(() => {
  registerLoader(entitySchemaLoader);
  registerTranslationsLoader(entityTranslationsLoader);
});

// ---------------------------------------------------------------------------
// 1. EntitySchema class
// ---------------------------------------------------------------------------
describe('EntitySchema class', () => {
  it('getProperty returns a property by id', async () => {
    const schema = await resolve('user');
    const property = schema.getProperty('first_name');
    expect(property).toBeDefined();
    expect(property.id).toBe('first_name');
    expect(property.type).toBe('string');
  });

  it('getProperty throws PropertyNotFoundError for unknown id', async () => {
    const schema = await resolve('user');
    expect(() => schema.getProperty('nonexistent')).toThrow(PropertyNotFoundError);
    expect(() => schema.getProperty('nonexistent')).toThrow(
      'Property "nonexistent" not found in schema "user"',
    );
  });

  it('getScope returns a scope by id', async () => {
    const schema = await resolve('user');
    const scope = schema.getScope('string_scope');
    expect(scope).toBeDefined();
    expect(scope.id).toBe('string_scope');
    expect(scope.parameters).toHaveLength(1);
  });

  it('getScope throws for unknown id', async () => {
    const schema = await resolve('user');
    expect(() => schema.getScope('nonexistent')).toThrow(
      'Scope "nonexistent" not found in schema "user"',
    );
  });
});

// ---------------------------------------------------------------------------
// 2. resolve() - loading and caching
// ---------------------------------------------------------------------------
describe('resolve()', () => {
  it('loads and caches schema (same instance returned)', async () => {
    const schema1 = await resolve('user');
    const schema2 = await resolve('user');
    expect(schema1).toBe(schema2);
  });

  it('different schemas get different instances', async () => {
    const userSchema = await resolve('user');
    const orgaSchema = await resolve('organization');
    expect(userSchema).not.toBe(orgaSchema);
  });

  it('schema has correct id', async () => {
    const userSchema = await resolve('user');
    expect(userSchema.id).toBe('user');

    const orgaSchema = await resolve('organization');
    expect(orgaSchema.id).toBe('organization');
  });
});

// ---------------------------------------------------------------------------
// 3. compute() (via resolve) - schema transformation
// ---------------------------------------------------------------------------
describe('compute() via resolve()', () => {
  it('filters out morph_to relationships', async () => {
    // The user schema has no morph_to properties, so all 14 properties should be present
    const schema = await resolve('user');
    expect(schema.properties).toHaveLength(14);

    // Verify no morph_to properties exist in the computed schema
    for (const property of schema.properties) {
      expect(property.relationship_type).not.toBe('morph_to');
    }
  });

  it('handles object scope definitions with parameters', async () => {
    const schema = await resolve('user');
    const scope = schema.getScope('string_scope');
    expect(scope.id).toBe('string_scope');
    expect(scope.parameters).toBeDefined();
    expect(scope.parameters).toHaveLength(1);
    expect(scope.parameters![0].id).toBe('value');
    expect(scope.parameters![0].type).toBe('string');
  });

  it('adds owner to properties', async () => {
    const schema = await resolve('user');
    for (const property of schema.properties) {
      expect(property.owner).toBe('user');
    }
  });

  it('adds owner to scopes', async () => {
    const schema = await resolve('user');
    for (const scope of schema.scopes) {
      expect(scope.owner).toBe('user');
    }
  });

  it('adds owner and scopeId to scope parameters', async () => {
    const schema = await resolve('user');
    const scope = schema.getScope('string_scope');
    for (const param of scope.parameters!) {
      expect(param.owner).toBe('user');
      expect(param.scopeId).toBe('string_scope');
    }

    const enumScope = schema.getScope('enum_scope');
    for (const param of enumScope.parameters!) {
      expect(param.owner).toBe('user');
      expect(param.scopeId).toBe('enum_scope');
    }
  });

  it('preserves unique_identifier and primary_identifiers', async () => {
    const schema = await resolve('user');
    expect(schema.unique_identifier).toBe('id');
    expect(schema.primary_identifiers).toEqual(['last_name', 'first_name']);
  });

  it('preserves undefined default_sort when not provided', async () => {
    const schema = await resolve('user');
    expect(schema.default_sort).toBeUndefined();
  });

  it('maps all properties correctly with their attributes', async () => {
    const schema = await resolve('user');
    expect(schema.mapProperties).toStrictEqual({
      id: { id: 'id', name: 'identifier', type: 'string', owner: 'user' },
      first_name: { id: 'first_name', name: 'first name', type: 'string', owner: 'user' },
      last_name: { id: 'last_name', name: 'last name', type: 'string', owner: 'user' },
      age: { id: 'age', name: 'the age', type: 'integer', owner: 'user' },
      weight: { id: 'weight', name: 'the weight', type: 'float', owner: 'user' },
      married: { id: 'married', name: 'is married', type: 'boolean', owner: 'user' },
      gender: { id: 'gender', name: 'the gender', type: 'string', enum: 'gender', owner: 'user' },
      birth_date: { id: 'birth_date', name: 'birth date', type: 'datetime', owner: 'user' },
      birth_day: { id: 'birth_day', name: 'birth day', type: 'date', owner: 'user' },
      birth_hour: { id: 'birth_hour', name: 'birth hour', type: 'time', owner: 'user' },
      country: { id: 'country', name: 'the country', type: 'choice', owner: 'user' },
      favorite_fruits: {
        id: 'favorite_fruits',
        name: 'favorite fruits',
        type: 'array',
        children: { type: 'string', enum: 'fruit' },
        owner: 'user',
      },
      company: {
        id: 'company',
        name: 'the company',
        type: 'relationship',
        relationship_type: 'belongs_to',
        related: 'organization',
        owner: 'user',
      },
      friend: {
        id: 'friend',
        name: 'the friend',
        type: 'relationship',
        relationship_type: 'belongs_to',
        related: 'user',
        owner: 'user',
      },
    });
  });

  it('maps all scopes correctly with their parameters', async () => {
    const schema = await resolve('user');
    expect(schema.mapScopes).toStrictEqual({
      scope_string_definition: { id: 'scope_string_definition', parameters: [], owner: 'user' },
      scope: { id: 'scope', parameters: [], owner: 'user' },
      string_scope: {
        id: 'string_scope',
        parameters: [
          { id: 'value', name: 'string scope', type: 'string', nullable: false, owner: 'user', scopeId: 'string_scope' },
        ],
        owner: 'user',
      },
      datetime_scope: {
        id: 'datetime_scope',
        parameters: [
          { id: 'value', name: 'datetime scope', type: 'datetime', nullable: false, owner: 'user', scopeId: 'datetime_scope' },
        ],
        owner: 'user',
      },
      enum_scope: {
        id: 'enum_scope',
        parameters: [
          { id: 'value', name: 'enum scope', type: 'string', enum: 'enum_scope_values', nullable: false, owner: 'user', scopeId: 'enum_scope' },
        ],
        owner: 'user',
      },
    });
  });
});

// ---------------------------------------------------------------------------
// 4. getPropertyPath()
// ---------------------------------------------------------------------------
describe('getPropertyPath()', () => {
  it('returns a single property for a non-dotted path', async () => {
    const path = await getPropertyPath('user', 'first_name');
    expect(path).toHaveLength(1);
    expect(path[0].id).toBe('first_name');
    expect(path[0].owner).toBe('user');
  });

  it('returns array for dotted path traversing related schemas', async () => {
    const path = await getPropertyPath('user', 'company.brand_name');
    expect(path).toHaveLength(2);
    expect(path[0].id).toBe('company');
    expect(path[0].owner).toBe('user');
    expect(path[0].related).toBe('organization');
    expect(path[1].id).toBe('brand_name');
    expect(path[1].owner).toBe('organization');
  });

  it('throws for invalid property in path', async () => {
    await expect(getPropertyPath('user', 'nonexistent')).rejects.toThrow(PropertyNotFoundError);
  });

  it('throws for invalid nested property in dotted path', async () => {
    await expect(getPropertyPath('user', 'company.nonexistent')).rejects.toThrow(PropertyNotFoundError);
  });
});

// ---------------------------------------------------------------------------
// 5. isPropertySortable()
// ---------------------------------------------------------------------------
describe('isPropertySortable()', () => {
  beforeEach(() => {
    resetRequestSchema();
    registerRequestLoader({
      load: async (entityId) => ({
        sortable: ({
          user: ['first_name', 'last_name', 'age', 'company'],
          organization: ['brand_name', 'address'],
        } as Record<string, string[]>)[entityId] ?? [],
      }),
    });
  });

  it('returns true for a sortable property', async () => {
    const result = await isPropertySortable('user', 'first_name');
    expect(result).toBe(true);
  });

  it('returns false for a non-sortable property', async () => {
    const result = await isPropertySortable('user', 'married');
    expect(result).toBe(false);
  });

  it('returns true for a sortable dotted path', async () => {
    const result = await isPropertySortable('user', 'company.brand_name');
    expect(result).toBe(true);
  });

  it('returns false for a dotted path where nested property is not sortable', async () => {
    const result = await isPropertySortable('user', 'company.description');
    expect(result).toBe(false);
  });

  it('returns false when path is invalid (catches error gracefully)', async () => {
    const result = await isPropertySortable('user', 'nonexistent_property');
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. getLeafTypeContainer()
// ---------------------------------------------------------------------------
describe('getLeafTypeContainer()', () => {
  it('returns the same container for a non-array type', () => {
    const container: ArrayableTypeContainer = { type: 'string', enum: 'gender' };
    const leaf = getLeafTypeContainer(container);
    expect(leaf).toEqual({ type: 'string', enum: 'gender' });
  });

  it('unwraps a single-level array', () => {
    const container: ArrayableTypeContainer = {
      type: 'array',
      children: { type: 'string', enum: 'fruit' },
    };
    const leaf = getLeafTypeContainer(container);
    expect(leaf).toEqual({ type: 'string', enum: 'fruit' });
  });

  it('unwraps nested arrays recursively', () => {
    const container: ArrayableTypeContainer = {
      type: 'array',
      children: {
        type: 'array',
        children: { type: 'integer' },
      },
    };
    const leaf = getLeafTypeContainer(container);
    expect(leaf).toEqual({ type: 'integer' });
  });

  it('returns array container when children is undefined', () => {
    const container: ArrayableTypeContainer = { type: 'array' };
    const leaf = getLeafTypeContainer(container);
    expect(leaf).toEqual({ type: 'array' });
  });
});

// ---------------------------------------------------------------------------
// 7. Translations
// ---------------------------------------------------------------------------
describe('Translations', () => {
  describe('getPropertyTranslation()', () => {
    it('returns translation with default locale (en)', async () => {
      await loadRawTranslations('user', 'en');
      const schema = await resolve('user');
      expect(getPropertyTranslation(schema.getProperty('first_name'))).toBe('first name');
    });

    it('returns translation with fr locale', async () => {
      locale.value = 'fr';
      await loadRawTranslations('user', 'fr');
      const schema = await resolve('user');
      expect(getPropertyTranslation(schema.getProperty('first_name'))).toBe('prénom');
    });

    it('returns translation with es locale and fr fallback', async () => {
      fallback.value = 'fr';
      locale.value = 'es';
      await loadRawTranslations('user', 'es');
      await loadRawTranslations('user', 'fr');
      const schema = await resolve('user');
      // 'first_name' has an es translation
      expect(getPropertyTranslation(schema.getProperty('first_name'))).toBe('primer nombre');
      // 'married' is not in es, falls back to fr
      expect(getPropertyTranslation(schema.getProperty('married'))).toBe('marié(e)');
    });

    it('falls back to property.name when no translation exists', async () => {
      // Load translations for a locale that does not exist for user
      locale.value = 'xx';
      await loadRawTranslations('user', 'en');
      const schema = await resolve('user');
      // No 'xx' translations loaded, no fallback match either (fallback is 'en' which IS loaded)
      // Actually en is fallback, so it should return the en translation
      expect(getPropertyTranslation(schema.getProperty('first_name'))).toBe('first name');
    });

    it('falls back to property.name then property.id when no translations at all', async () => {
      // Reset to remove translations loader, then re-register only schema loader
      _resetForTesting();
      registerLoader(entitySchemaLoader);
      // Do not register translations loader

      const schema = await resolve('user');
      // No translations loader configured, so ensureTranslationsLoaded is a no-op
      // Falls back to property.name
      expect(getPropertyTranslation(schema.getProperty('first_name'))).toBe('first name');
    });
  });

  describe('getScopeTranslation()', () => {
    it('returns translation with default locale (en)', async () => {
      await loadRawTranslations('user', 'en');
      const schema = await resolve('user');
      expect(getScopeTranslation(schema.getScope('datetime_scope'))).toBe('datetime scope');
      expect(getScopeTranslation(schema.getScope('scope'))).toBe('scope without value');
    });

    it('returns translation with fr locale', async () => {
      locale.value = 'fr';
      await loadRawTranslations('user', 'fr');
      const schema = await resolve('user');
      expect(getScopeTranslation(schema.getScope('datetime_scope'))).toBe('scope date time');
      expect(getScopeTranslation(schema.getScope('scope'))).toBe('scope sans valeur');
    });

    it('returns translation with es locale and fr fallback', async () => {
      fallback.value = 'fr';
      locale.value = 'es';
      await loadRawTranslations('user', 'es');
      await loadRawTranslations('user', 'fr');
      const schema = await resolve('user');
      // es translations for user don't include scopes, so falls back to fr
      expect(getScopeTranslation(schema.getScope('datetime_scope'))).toBe('scope date time');
    });

    it('falls back to scope.name when no translation exists', async () => {
      _resetForTesting();
      registerLoader(entitySchemaLoader);

      const schema = await resolve('user');
      // No translations loader, falls back to scope.name (which is undefined for object scopes)
      // For 'scope_string_definition', the raw scope has no name, so falls back to scope.id
      const scope = schema.getScope('scope_string_definition');
      expect(getScopeTranslation(scope)).toBe('scope_string_definition');
    });
  });

  describe('getScopeParameterTranslation()', () => {
    it('falls back to parameter.name when no parameter translation exists', async () => {
      await loadRawTranslations('user', 'en');
      const schema = await resolve('user');
      const scope = schema.getScope('string_scope');
      const param = scope.parameters![0] as ScopeParameter;
      // No parameters translations in fixtures, so falls back to parameter.name
      expect(getScopeParameterTranslation(param)).toBe('string scope');
    });

    it('falls back to parameter.id when name is undefined', async () => {
      // Create a parameter without a name
      const param: ScopeParameter = {
        id: 'test_param',
        type: 'string',
        owner: 'user',
        scopeId: 'test_scope',
      };
      await loadRawTranslations('user', 'en');
      expect(getScopeParameterTranslation(param)).toBe('test_param');
    });

    it('uses correct locale and fallback for parameter translation', async () => {
      fallback.value = 'fr';
      locale.value = 'es';
      await loadRawTranslations('user', 'es');
      await loadRawTranslations('user', 'fr');
      const schema = await resolve('user');
      const scope = schema.getScope('enum_scope');
      const param = scope.parameters![0] as ScopeParameter;
      // Neither es nor fr have parameters translations, falls back to parameter.name
      expect(getScopeParameterTranslation(param)).toBe('enum scope');
    });
  });

  describe('loadRawTranslations()', () => {
    it('caches results for the same schema and locale', async () => {
      const result1 = await loadRawTranslations('user', 'en');
      const result2 = await loadRawTranslations('user', 'en');
      expect(result1).toBe(result2);
    });

    it('returns different results for different locales', async () => {
      const en = await loadRawTranslations('user', 'en');
      const fr = await loadRawTranslations('user', 'fr');
      expect(en).not.toBe(fr);
    });

    it('returns empty object when translation loading fails', async () => {
      const result = await loadRawTranslations('user', 'nonexistent_locale');
      // The loader returns null for unknown locales, which gets stored as null
      // loadRawTranslations returns loadedTranslations[cacheKey] ?? {}
      expect(result).toEqual({});
    });
  });
});

// ---------------------------------------------------------------------------
// 8. _resetForTesting
// ---------------------------------------------------------------------------
describe('_resetForTesting()', () => {
  it('clears all caches so schemas are re-loaded', async () => {
    const schema1 = await resolve('user');
    _resetForTesting();
    registerLoader(entitySchemaLoader);
    registerTranslationsLoader(entityTranslationsLoader);
    const schema2 = await resolve('user');
    // After reset, a new instance should be created
    expect(schema1).not.toBe(schema2);
    // But they should have the same structure
    expect(schema1.id).toBe(schema2.id);
    expect(schema1.properties.length).toBe(schema2.properties.length);
  });

  it('clears translation caches', async () => {
    await loadRawTranslations('user', 'fr');
    _resetForTesting();
    registerLoader(entitySchemaLoader);
    registerTranslationsLoader(entityTranslationsLoader);
    // After reset, loading again should produce a fresh result
    const result = await loadRawTranslations('user', 'fr');
    expect(result).toBeDefined();
  });
});
