import { describe, it, expect, beforeAll } from 'vitest';

import { entitySchemaLoader } from '@tests/assets/SchemaLoader';
import { resolve, registerLoader } from '@core/EntitySchema';

beforeAll(() => {
  registerLoader(entitySchemaLoader);
});

describe('test schemas', async () => {
  it('test schema instance', async () => {
    const schema = await resolve('user');
    expect(schema).toBeDefined();
    expect(schema.id).toBe('user');

    const schemaTwo = await resolve('user');
    expect(schema).toBe(schemaTwo);

    const schemaOrga = await resolve('organization');
    expect(schemaOrga).toBeDefined();
    expect(schemaOrga.id).toBe('organization');

    const schemaOrgaTwo = await resolve('organization');
    expect(schemaOrga).toBe(schemaOrgaTwo);

    expect(schemaOrga === schema).toBe(false);
  });
  it('test computed schema without locales', async () => {
    const schema = await resolve('user');
    expect(schema).toBeDefined();
    expect(schema.id).toBe('user');
    expect(schema.mapProperties).toStrictEqual({
      id: { id: 'id', name: 'identifier', type: 'string', owner: 'user' },
      first_name: { id: 'first_name', name: 'first name', type: 'string', owner: 'user' },
      last_name: { id: 'last_name', name: 'last name', type: 'string', owner: 'user' },
      age: { id: 'age', name: 'the age', type: 'integer', owner: 'user' },
      weight: { id: 'weight', name: 'the weight', type: 'float', owner: 'user' },
      married: { id: 'married', name: 'is married', type: 'boolean', owner: 'user' },
      gender: { id: 'gender', name: 'the gender', type: 'string', enum: 'gender', owner: 'user' },
      'birth.birth_date': { id: 'birth.birth_date', name: 'birth date', type: 'datetime', owner: 'user' },
      'birth.birth_day': { id: 'birth.birth_day', name: 'birth day', type: 'date', owner: 'user' },
      'birth.birth_hour': { id: 'birth.birth_hour', name: 'birth hour', type: 'time', owner: 'user' },
      country: { id: 'country', name: 'the country', type: 'choice', owner: 'user' },
      favorite_fruits: {
        id: 'favorite_fruits',
        name: 'favorite fruits',
        type: 'array',
        children: {
          type: 'string',
          enum: 'fruit',
        },
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
    expect(schema.mapScopes).toStrictEqual({
      scope_string_definition: { id: 'scope_string_definition', parameters: [], owner: 'user' },
      scope: { id: 'scope', parameters: [], owner: 'user' },
      string_scope: {
        id: 'string_scope',
        parameters: [{ id: 'value', name: 'string scope', type: 'string', nullable: false, owner: 'user', scopeId: 'string_scope' }],
        owner: 'user',
      },
      datetime_scope: {
        id: 'datetime_scope',
        parameters: [{ id: 'value', name: 'datetime scope', type: 'datetime', nullable: false, owner: 'user', scopeId: 'datetime_scope' }],
        owner: 'user',
      },
      enum_scope: {
        id: 'enum_scope',
        parameters: [{ id: 'value', name: 'enum scope', type: 'string', enum: 'enum_scope_values', nullable: false, owner: 'user', scopeId: 'enum_scope' }],
        owner: 'user',
      },
    });
  });
});
