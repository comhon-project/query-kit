import { describe, it, expect, beforeAll } from 'vitest';

import { schemaLoader, schemaLocaleLoader } from '../assets/SchemaLoader';
import { resolve, registerLoader, registerLocaleLoader } from '../../core/Schema';
import { locale, fallback } from '../../i18n/i18n';

beforeAll(() => {
  registerLoader(schemaLoader);
  registerLocaleLoader(schemaLocaleLoader);
});

describe('test schemas', async () => {
  it('test computed schema with default locale', async () => {
    const schema = await resolve('user');
    expect(schema.mapProperties.first_name.name.value).toBe('first name');
    expect(schema.mapScopes.datetime_scope.name.value).toBe('datetime scope');
  });
  it('test computed schema with locale "fr"', async () => {
    locale.value = 'fr';
    const schema = await resolve('user');
    await new Promise((resolve) => {
      setTimeout(() => {
        expect(schema.mapProperties.first_name.name.value).toBe('prénom');
        expect(schema.mapScopes.datetime_scope.name.value).toBe('scope date time');
        resolve();
      }, 10);
    });
  });
  it('test computed schema with locale "es" and fallback "fr"', async () => {
    fallback.value = 'fr';
    locale.value = 'es';
    const schema = await resolve('user');
    await new Promise((resolve) => {
      setTimeout(() => {
        expect(schema.mapProperties.first_name.name.value).toBe('primer nombre');
        expect(schema.mapProperties.married.name.value).toBe('marié(e)');
        expect(schema.mapScopes.datetime_scope.name.value).toBe('scope date time');
        resolve();
      }, 10);
    });
  });
});
