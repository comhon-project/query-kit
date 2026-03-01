import { describe, it, expect, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { useSearchable } from '@components/Filter/Composable/Searchable';
import { EntitySchema } from '@core/EntitySchema';
import type { Property, Scope } from '@core/EntitySchema';
import type { BuilderConfig } from '@core/types';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { registerComputedScopes } from '@core/ComputedScopesManager';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';

function makeProp(id: string, type: string = 'string'): Property {
  return { id, type, owner: 'user' } as Property;
}

function makeScope(id: string): Scope {
  return { id, parameters: [] } as unknown as Scope;
}

function makeSchema(properties: Property[] = [], scopes: Scope[] = []): EntitySchema {
  const mapProperties: Record<string, Property> = {};
  for (const p of properties) mapProperties[p.id] = p;
  const mapScopes: Record<string, Scope> = {};
  for (const s of scopes) mapScopes[s.id] = s;
  return new EntitySchema('user', properties, mapProperties, scopes, mapScopes);
}

async function flushWatchEffects() {
  await nextTick();
  // watchEffect with async needs an extra tick for the microtask to resolve
  await new Promise((r) => setTimeout(r, 0));
  await nextTick();
}

describe('useSearchable', () => {
  beforeEach(() => {
    registerRequestLoader(requestSchemaLoader);
  });

  describe('searchableProperties', () => {
    it('loads filtrable properties', async () => {
      const prop = makeProp('first_name');
      const schema = makeSchema([prop]);

      const { searchableProperties } = useSearchable({}, { entitySchema: schema });
      await flushWatchEffects();

      expect(searchableProperties.value).toEqual([prop]);
    });

    it('filters by allowedProperties config', async () => {
      const p1 = makeProp('first_name');
      const p2 = makeProp('last_name');
      const schema = makeSchema([p1, p2]);

      const config: BuilderConfig = { allowedProperties: { user: ['first_name'] } };
      const { searchableProperties } = useSearchable(config, { entitySchema: schema });
      await flushWatchEffects();

      expect(searchableProperties.value).toEqual([p1]);
    });

    it('excludes properties with no operators', async () => {
      const prop = makeProp('first_name');
      const schema = makeSchema([prop]);

      const config: BuilderConfig = { allowedOperators: { condition: { basic: [] } } };
      const { searchableProperties } = useSearchable(config, { entitySchema: schema });
      await flushWatchEffects();

      expect(searchableProperties.value).toEqual([]);
    });

    it('includes relationship properties only when relationship_condition operators exist', async () => {
      const relProp = makeProp('company', 'relationship');
      const schema = makeSchema([relProp]);

      const config: BuilderConfig = { allowedOperators: { relationship_condition: [] } };
      const { searchableProperties } = useSearchable(config, { entitySchema: schema });
      await flushWatchEffects();

      expect(searchableProperties.value).toEqual([]);

      // Now with default operators
      const { searchableProperties: sp2 } = useSearchable({}, { entitySchema: schema });
      await flushWatchEffects();

      expect(sp2.value).toEqual([relProp]);
    });

    it('reports invalid properties (PropertyNotFoundError)', async () => {
      const schema = makeSchema([]); // no properties defined

      const { searchableProperties, invalidProperties } = useSearchable({}, { entitySchema: schema });
      await flushWatchEffects();

      expect(searchableProperties.value).toEqual([]);
      expect(invalidProperties.value).toContain('first_name');
      expect(invalidProperties.value).toContain('last_name');
      expect(invalidProperties.value.length).toBeGreaterThan(0);
    });
  });

  describe('searchableScopes', () => {
    it('loads filtrable scopes', async () => {
      const scope = makeScope('scope');
      const schema = makeSchema([], [scope]);

      const { searchableScopes } = useSearchable({}, { entitySchema: schema });
      await flushWatchEffects();

      expect(searchableScopes.value).toEqual([scope]);
    });

    it('filters by allowedScopes config', async () => {
      const s1 = makeScope('scope');
      const s2 = makeScope('string_scope');
      const schema = makeSchema([], [s1, s2]);

      const config: BuilderConfig = { allowedScopes: { user: ['scope'] } };
      const { searchableScopes } = useSearchable(config, { entitySchema: schema });
      await flushWatchEffects();

      expect(searchableScopes.value).toEqual([s1]);
    });

    it('reports invalid scopes', async () => {
      const schema = makeSchema([], []); // no scopes defined

      const { searchableScopes, invalidScopes } = useSearchable({}, { entitySchema: schema });
      await flushWatchEffects();

      expect(searchableScopes.value).toEqual([]);
      expect(invalidScopes.value).toContain('scope');
      expect(invalidScopes.value.length).toBeGreaterThan(0);
    });
  });

  describe('searchableComputedScopes', () => {
    it('returns computed scopes from ComputedScopesManager', () => {
      const cs = { id: 'computed_1', name: 'Computed 1' };
      registerComputedScopes({ user: [cs as any] });
      const schema = makeSchema();

      const { searchableComputedScopes } = useSearchable({}, { entitySchema: schema });

      expect(searchableComputedScopes.value).toEqual([cs]);
    });

    it('returns empty array when no computed scopes', () => {
      const schema = makeSchema();

      const { searchableComputedScopes } = useSearchable({}, { entitySchema: schema });

      expect(searchableComputedScopes.value).toEqual([]);
    });

    it('filters by allowedScopes config', () => {
      const cs1 = { id: 'cs_a', name: 'A' };
      const cs2 = { id: 'cs_b', name: 'B' };
      registerComputedScopes({ user: [cs1, cs2] as any });
      const schema = makeSchema();

      const config: BuilderConfig = { allowedScopes: { user: ['cs_a'] } };
      const { searchableComputedScopes } = useSearchable(config, { entitySchema: schema });

      expect(searchableComputedScopes.value).toEqual([cs1]);
    });
  });

  describe('hasSearchableItems', () => {
    it('is false when nothing is searchable', async () => {
      const schema = makeSchema();

      const { hasSearchableItems } = useSearchable({}, { entitySchema: schema });
      await flushWatchEffects();

      expect(hasSearchableItems.value).toBe(false);
    });

    it('is true when there are searchable properties', async () => {
      const prop = makeProp('first_name');
      const schema = makeSchema([prop]);

      const { hasSearchableItems } = useSearchable({}, { entitySchema: schema });
      await flushWatchEffects();

      expect(hasSearchableItems.value).toBe(true);
    });

    it('is true when there are searchable scopes', async () => {
      const scope = makeScope('scope');
      const schema = makeSchema([], [scope]);

      const { hasSearchableItems } = useSearchable({}, { entitySchema: schema });
      await flushWatchEffects();

      expect(hasSearchableItems.value).toBe(true);
    });

    it('is true when there are computed scopes', () => {
      registerComputedScopes({ user: [{ id: 'cs', name: 'CS' }] as any });
      const schema = makeSchema();

      const { hasSearchableItems } = useSearchable({}, { entitySchema: schema });

      expect(hasSearchableItems.value).toBe(true);
    });
  });
});
