import { describe, it, expect, afterEach } from 'vitest';

import {
  registerComputedScopes,
  getComputedScopes,
  getComputedScope,
  getComputedScopeTranslation,
  getComputedScopeParameterTranslation,
  _resetForTesting,
} from '@core/ComputedScopesManager';
import type { ComputedScope, ComputedScopeParameter } from '@core/ComputedScopesManager';
import { locale } from '@i18n/i18n';

describe('ComputedScopesManager', () => {
  afterEach(() => {
    _resetForTesting();
    locale.value = 'en';
  });

  const createScope = (overrides: Partial<ComputedScope> = {}): ComputedScope => ({
    id: 'test_scope',
    computed: (params: unknown[]) => ({ value: params }),
    ...overrides,
  });

  describe('registerComputedScopes', () => {
    it('registers scopes for an entity', () => {
      const scope = createScope({ id: 'active' });
      registerComputedScopes({ user: [scope] });

      expect(getComputedScopes('user')).toHaveLength(1);
      expect(getComputedScopes('user')[0].id).toBe('active');
    });

    it('registers scopes for multiple entities', () => {
      registerComputedScopes({
        user: [createScope({ id: 'active' })],
        order: [createScope({ id: 'recent' }), createScope({ id: 'pending' })],
      });

      expect(getComputedScopes('user')).toHaveLength(1);
      expect(getComputedScopes('order')).toHaveLength(2);
    });
  });

  describe('getComputedScopes', () => {
    it('returns scopes for a registered entity', () => {
      const scopes = [createScope({ id: 'scope1' }), createScope({ id: 'scope2' })];
      registerComputedScopes({ user: scopes });

      const result = getComputedScopes('user');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('scope1');
      expect(result[1].id).toBe('scope2');
    });

    it('returns an empty array for an unknown entity', () => {
      expect(getComputedScopes('nonexistent')).toEqual([]);
    });
  });

  describe('getComputedScope', () => {
    it('returns a specific scope by entity and scopeId', () => {
      registerComputedScopes({
        user: [createScope({ id: 'active' }), createScope({ id: 'verified' })],
      });

      const scope = getComputedScope('user', 'verified');
      expect(scope).toBeDefined();
      expect(scope!.id).toBe('verified');
    });

    it('returns undefined for an unknown scopeId', () => {
      registerComputedScopes({ user: [createScope({ id: 'active' })] });

      expect(getComputedScope('user', 'nonexistent')).toBeUndefined();
    });

    it('returns undefined for an unknown entity', () => {
      expect(getComputedScope('nonexistent', 'any')).toBeUndefined();
    });
  });

  describe('getComputedScopeTranslation', () => {
    it('uses the translation function when provided', () => {
      const scope = createScope({
        id: 'active',
        name: 'Active',
        translation: (loc: string) => (loc === 'en' ? 'Active Users' : 'Utilisateurs actifs'),
      });

      expect(getComputedScopeTranslation(scope)).toBe('Active Users');
    });

    it('uses the translation function with the current locale', () => {
      locale.value = 'fr';
      const scope = createScope({
        id: 'active',
        name: 'Active',
        translation: (loc: string) => (loc === 'fr' ? 'Utilisateurs actifs' : 'Active Users'),
      });

      expect(getComputedScopeTranslation(scope)).toBe('Utilisateurs actifs');
    });

    it('falls back to name when translation is not provided', () => {
      const scope = createScope({ id: 'active', name: 'Active' });

      expect(getComputedScopeTranslation(scope)).toBe('Active');
    });

    it('falls back to id when neither translation nor name is provided', () => {
      const scope = createScope({ id: 'active' });

      expect(getComputedScopeTranslation(scope)).toBe('active');
    });
  });

  describe('getComputedScopeParameterTranslation', () => {
    it('uses the translation function when provided', () => {
      const parameter: ComputedScopeParameter = {
        id: 'min_age',
        type: 'integer',
        translation: (loc: string) => (loc === 'en' ? 'Minimum Age' : 'Age minimum'),
      };

      expect(getComputedScopeParameterTranslation(parameter)).toBe('Minimum Age');
    });

    it('uses the translation function with the current locale', () => {
      locale.value = 'fr';
      const parameter: ComputedScopeParameter = {
        id: 'min_age',
        type: 'integer',
        translation: (loc: string) => (loc === 'fr' ? 'Age minimum' : 'Minimum Age'),
      };

      expect(getComputedScopeParameterTranslation(parameter)).toBe('Age minimum');
    });

    it('falls back to name when translation is not provided', () => {
      const parameter: ComputedScopeParameter = {
        id: 'min_age',
        type: 'integer',
        name: 'Min Age',
      };

      expect(getComputedScopeParameterTranslation(parameter)).toBe('Min Age');
    });

    it('falls back to id when neither translation nor name is provided', () => {
      const parameter: ComputedScopeParameter = {
        id: 'min_age',
        type: 'integer',
      };

      expect(getComputedScopeParameterTranslation(parameter)).toBe('min_age');
    });
  });

  describe('_resetForTesting', () => {
    it('clears all registered computed scopes', () => {
      registerComputedScopes({
        user: [createScope({ id: 'active' })],
        order: [createScope({ id: 'recent' })],
      });

      expect(getComputedScopes('user')).toHaveLength(1);
      expect(getComputedScopes('order')).toHaveLength(1);

      _resetForTesting();

      expect(getComputedScopes('user')).toEqual([]);
      expect(getComputedScopes('order')).toEqual([]);
    });
  });
});
