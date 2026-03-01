import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  registerLoader,
  resolve,
  getFiltrableProperties,
  getFiltrableScopes,
  getSortableProperties,
  _resetForTesting,
} from '@core/RequestSchema';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';

beforeEach(() => {
  registerLoader(requestSchemaLoader);
});

afterEach(() => {
  _resetForTesting();
});

describe('RequestSchema', () => {
  describe('resolve()', () => {
    it('loads and caches a request schema', async () => {
      const schema = await resolve('user');
      expect(schema).toBeDefined();
      expect(schema.filtrable).toBeDefined();
      expect(schema.sortable).toBeDefined();
    });

    it('returns the same instance for the same id (caching)', async () => {
      const first = await resolve('user');
      const second = await resolve('user');
      expect(first).toBe(second);
    });

    it('returns different instances for different ids', async () => {
      const user = await resolve('user');
      const organization = await resolve('organization');
      expect(user).not.toBe(organization);
    });

    it('throws when loader is not configured', async () => {
      _resetForTesting();
      await expect(resolve('user')).rejects.toThrow('Request schema loader not configured');
    });

    it('throws when schema is not found', async () => {
      await expect(resolve('nonexistent')).rejects.toThrow('Request schema "nonexistent" not found');
    });
  });

  describe('getFiltrableProperties()', () => {
    it('returns correct list of filtrable properties', async () => {
      const properties = await getFiltrableProperties('user');
      expect(properties).toEqual([
        'first_name',
        'last_name',
        'age',
        'gender',
        'married',
        'birth_date',
        'company',
        'favorite_fruits',
      ]);
    });

    it('returns empty array when filtrable properties are not defined', async () => {
      _resetForTesting();
      registerLoader({
        load: async () => ({}),
      });

      const properties = await getFiltrableProperties('empty');
      expect(properties).toEqual([]);
    });
  });

  describe('getFiltrableScopes()', () => {
    it('returns correct list of filtrable scopes', async () => {
      const scopes = await getFiltrableScopes('user');
      expect(scopes).toEqual(['scope', 'string_scope', 'datetime_scope', 'enum_scope']);
    });

    it('returns empty array when filtrable scopes are not defined', async () => {
      _resetForTesting();
      registerLoader({
        load: async () => ({}),
      });

      const scopes = await getFiltrableScopes('empty');
      expect(scopes).toEqual([]);
    });
  });

  describe('getSortableProperties()', () => {
    it('returns correct list of sortable properties', async () => {
      const sortable = await getSortableProperties('user');
      expect(sortable).toEqual(['first_name', 'last_name', 'age']);
    });

    it('returns empty array when sortable properties are not defined', async () => {
      _resetForTesting();
      registerLoader({
        load: async () => ({}),
      });

      const sortable = await getSortableProperties('empty');
      expect(sortable).toEqual([]);
    });
  });

  describe('_resetForTesting()', () => {
    it('clears all caches so resolve fetches again', async () => {
      const first = await resolve('user');
      _resetForTesting();

      // Must re-register loader after reset
      registerLoader(requestSchemaLoader);

      const second = await resolve('user');
      // After reset, a new instance should be created (structuredClone produces new objects)
      expect(first).not.toBe(second);
    });

    it('clears loader configuration', async () => {
      _resetForTesting();
      await expect(resolve('user')).rejects.toThrow('Request schema loader not configured');
    });
  });
});
