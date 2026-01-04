import { describe, it, expect, beforeAll } from 'vitest';

import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { resolve, registerLoader, registerTranslationsLoader, getPropertyTranslation, getScopeTranslation, loadRawTranslations } from '@core/EntitySchema';
import { locale, fallback } from '@i18n/i18n';

beforeAll(() => {
  registerLoader(entitySchemaLoader);
  registerTranslationsLoader(entityTranslationsLoader);
});

describe('test schemas', async () => {
  it('test computed schema with default locale', async () => {
    const schema = await resolve('user');
    expect(getPropertyTranslation(schema.mapProperties['first_name'])).toBe('first name');
    expect(getScopeTranslation(schema.mapScopes['datetime_scope'])).toBe('datetime scope');
  });
  it('test computed schema with locale "fr"', async () => {
    locale.value = 'fr';
    await loadRawTranslations('user', 'fr');
    const schema = await resolve('user');
    expect(getPropertyTranslation(schema.mapProperties['first_name'])).toBe('prénom');
    expect(getScopeTranslation(schema.mapScopes['datetime_scope'])).toBe('scope date time');
  });
  it('test computed schema with locale "es" and fallback "fr"', async () => {
    fallback.value = 'fr';
    locale.value = 'es';
    await loadRawTranslations('user', 'es');
    await loadRawTranslations('user', 'fr');
    const schema = await resolve('user');
    expect(getPropertyTranslation(schema.mapProperties['first_name'])).toBe('primer nombre');
    expect(getPropertyTranslation(schema.mapProperties['married'])).toBe('marié(e)');
    expect(getScopeTranslation(schema.mapScopes['datetime_scope'])).toBe('scope date time');
  });
});
