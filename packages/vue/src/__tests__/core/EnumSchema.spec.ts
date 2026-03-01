import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  registerLoader,
  registerTranslationsLoader,
  resolve,
  getCases,
  getTranslation,
  _resetForTesting,
} from '@core/EnumSchema';
import { enumSchemaLoader, enumTranslationsLoader } from '@tests/assets/SchemaLoader';
import { locale, fallback, _resetForTesting as _resetI18nForTesting } from '@i18n/i18n';

beforeEach(() => {
  registerLoader(enumSchemaLoader);
  registerTranslationsLoader(enumTranslationsLoader);
});

afterEach(() => {
  _resetForTesting();
  _resetI18nForTesting();
});

describe('EnumSchema', () => {
  describe('resolve()', () => {
    it('loads and caches an enum schema', async () => {
      const schema = await resolve('gender');
      expect(schema).toBeDefined();
      expect(schema.cases).toHaveLength(2);
      expect(schema.mapCases).toBeDefined();
    });

    it('returns the same instance for the same id (caching)', async () => {
      const first = await resolve('gender');
      const second = await resolve('gender');
      expect(first).toBe(second);
    });

    it('returns different instances for different ids', async () => {
      const gender = await resolve('gender');
      const fruit = await resolve('fruit');
      expect(gender).not.toBe(fruit);
    });

    it('throws when loader is not configured', async () => {
      _resetForTesting();
      await expect(resolve('gender')).rejects.toThrow('Enum schema loader not configured');
    });

    it('throws when enum is not found (loader returns null)', async () => {
      await expect(resolve('nonexistent')).rejects.toThrow('Enum schema "nonexistent" not found');
    });
  });

  describe('getCases()', () => {
    it('returns all cases for an enum', async () => {
      const cases = await getCases('gender');
      expect(cases).toHaveLength(2);
      expect(cases[0].id).toBe('male');
      expect(cases[1].id).toBe('female');
    });

    it('cases have correct owner property', async () => {
      const cases = await getCases('gender');
      for (const c of cases) {
        expect(c.owner).toBe('gender');
      }
    });

    it('returns cases for a different enum', async () => {
      const cases = await getCases('fruit');
      expect(cases).toHaveLength(3);
      expect(cases[0].id).toBe('1');
      expect(cases[1].id).toBe('2');
      expect(cases[2].id).toBe('3');
      for (const c of cases) {
        expect(c.owner).toBe('fruit');
      }
    });
  });

  describe('getTranslation()', () => {
    it('returns translation for the current locale', async () => {
      const schema = await resolve('gender');
      const maleCase = schema.mapCases['male'];
      expect(getTranslation(maleCase)).toBe('Mr.');
    });

    it('falls back to fallback locale when current locale has no translation', async () => {
      const schema = await resolve('gender');
      locale.value = 'es';
      // Wait for translations to load
      await resolve('gender');

      // 'female' has no Spanish translation, should fall back to English ('Ms.')
      const femaleCase = schema.mapCases['female'];
      expect(getTranslation(femaleCase)).toBe('Ms.');
    });

    it('falls back to case.name when no translations exist', async () => {
      // Reset and register only the schema loader (no translations loader)
      _resetForTesting();
      registerLoader(enumSchemaLoader);

      const schema = await resolve('gender');
      const maleCase = schema.mapCases['male'];
      expect(getTranslation(maleCase)).toBe('Mr.');
    });

    it('falls back to case.id when no translations and no name', async () => {
      _resetForTesting();
      registerLoader({
        load: async () => ({
          cases: [{ id: 'no_name_case' }],
        }),
      });

      const schema = await resolve('test_enum');
      const noNameCase = schema.mapCases['no_name_case'];
      expect(getTranslation(noNameCase)).toBe('no_name_case');
    });

    it('returns French translation when locale is fr', async () => {
      locale.value = 'fr';
      const schema = await resolve('gender');
      const maleCase = schema.mapCases['male'];

      expect(getTranslation(maleCase)).toBe('M.');
    });
  });

  describe('loadRawTranslations', () => {
    it('caches translation results (loaded once per locale/enum)', async () => {
      // Resolve triggers translation loading for the current locale
      await resolve('gender');

      // Resolve again - should use cached translations
      const schema = await resolve('gender');
      const maleCase = schema.mapCases['male'];
      expect(getTranslation(maleCase)).toBe('Mr.');
    });

    it('handles errors gracefully by setting empty object', async () => {
      _resetForTesting();
      registerLoader(enumSchemaLoader);
      registerTranslationsLoader({
        load: async () => {
          throw new Error('Network error');
        },
      });

      const schema = await resolve('gender');
      const maleCase = schema.mapCases['male'];

      // With failed translations, should fall back to case.name
      expect(getTranslation(maleCase)).toBe('Mr.');
    });
  });

  describe('_resetForTesting()', () => {
    it('clears all caches so resolve fetches again', async () => {
      const first = await resolve('gender');
      _resetForTesting();

      // Must re-register loader after reset
      registerLoader(enumSchemaLoader);
      registerTranslationsLoader(enumTranslationsLoader);

      const second = await resolve('gender');
      // After reset, a new instance should be created
      expect(first).not.toBe(second);
    });

    it('clears loader configuration', async () => {
      _resetForTesting();
      await expect(resolve('gender')).rejects.toThrow('Enum schema loader not configured');
    });
  });
});
