import { describe, it, expect, beforeAll } from 'vitest';

import { schemaLoader, schemaLocaleLoader } from '@tests/assets/SchemaLoader';
import { resolve, registerLoader, registerLocaleLoader, getPropertyTranslation, loadRawTranslations } from '@core/Schema';
import { locale, fallback } from '@i18n/i18n';

beforeAll(() => {
  registerLoader(schemaLoader);
  registerLocaleLoader(schemaLocaleLoader);
});

describe('test schemas', async () => {
  it('test computed schema with default locale', async () => {
    const schema = await resolve('user');
    expect(getPropertyTranslation(schema.mapProperties['first_name'])).toBe('first name');
    expect(getPropertyTranslation(schema.mapScopes['datetime_scope'])).toBe('datetime scope');
  });
  it('test computed schema with locale "fr"', async () => {
    locale.value = 'fr';
    await loadRawTranslations('user', 'fr');
    const schema = await resolve('user');
    expect(getPropertyTranslation(schema.mapProperties['first_name'])).toBe('prénom');
    expect(getPropertyTranslation(schema.mapScopes['datetime_scope'])).toBe('scope date time');
  });
  it('test computed schema with locale "es" and fallback "fr"', async () => {
    fallback.value = 'fr';
    locale.value = 'es';
    await loadRawTranslations('user', 'es');
    await loadRawTranslations('user', 'fr');
    const schema = await resolve('user');
    expect(getPropertyTranslation(schema.mapProperties['first_name'])).toBe('primer nombre');
    expect(getPropertyTranslation(schema.mapProperties['married'])).toBe('marié(e)');
    expect(getPropertyTranslation(schema.mapScopes['datetime_scope'])).toBe('scope date time');
  });
});
