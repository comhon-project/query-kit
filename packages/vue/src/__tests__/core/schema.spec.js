import { describe, it, expect, beforeAll } from 'vitest';

import { schemaLoader } from '@tests/assets/SchemaLoader';
import { resolve, registerLoader } from '@core/Schema';

beforeAll(() => {
  registerLoader(schemaLoader);
});

describe('test schemas', async () => {
  it('test schema instance', async () => {
    const schema = await resolve('user');
    expect(schema).toBeDefined();
    expect(schema.name).toBe('user');

    const schemaTwo = await resolve('user');
    expect(schema).toBe(schemaTwo);

    const schemaOrga = await resolve('organization');
    expect(schemaOrga).toBeDefined();
    expect(schemaOrga.name).toBe('organization');

    const schemaOrgaTwo = await resolve('organization');
    expect(schemaOrga).toBe(schemaOrgaTwo);

    expect(schemaOrga === schema).toBe(false);
  });
  it('test computed schema without locales', async () => {
    const schema = await resolve('user');
    expect(schema).toBeDefined();
    expect(schema.name).toBe('user');
    expect(schema.mapProperties).toStrictEqual({
      id: { id: 'id', name: 'identifier', type: 'string', owner: 'user' },
      first_name: { id: 'first_name', name: 'first name', type: 'string', owner: 'user' },
      last_name: { id: 'last_name', name: 'last name', type: 'string', owner: 'user' },
      age: { id: 'age', name: 'the age', type: 'integer', owner: 'user' },
      weight: { id: 'weight', name: 'the weight', type: 'float', owner: 'user' },
      married: { id: 'married', name: 'is married', type: 'boolean', owner: 'user' },
      gender: { id: 'gender', name: 'the gender', type: 'string', enum: { male: 'Mr.', female: 'Ms.' }, owner: 'user' },
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
          enum: ['1', '2', '3'],
        },
        owner: 'user',
      },
      company: {
        id: 'company',
        name: 'the company',
        type: 'relationship',
        relationship_type: 'belongs_to',
        model: 'organization',
        owner: 'user',
      },
      friend: {
        id: 'friend',
        name: 'the friend',
        type: 'relationship',
        relationship_type: 'belongs_to',
        model: 'user',
        owner: 'user',
      },
    });
    expect(schema.mapScopes).toStrictEqual({
      scope_string_definition: { id: 'scope_string_definition', name: 'scope_string_definition', owner: 'user' },
      scope: { id: 'scope', name: 'scope without value', owner: 'user' },
      string_scope: { id: 'string_scope', name: 'string scope', type: 'string', useOperator: true, owner: 'user' },
      datetime_scope: { id: 'datetime_scope', name: 'datetime scope', type: 'datetime', owner: 'user' },
      enum_scope: {
        id: 'enum_scope',
        name: 'enum scope',
        type: 'string',
        enum: { one: 'value one', two: 'value two' },
        owner: 'user',
      },
    });
    expect(schema.search.properties).toStrictEqual([
      'first_name',
      'age',
      'weight',
      'gender',
      'married',
      'birth.birth_date',
      'birth.birth_day',
      'birth.birth_hour',
      'company',
      'friend',
      'country',
      'favorite_fruits',
    ]);
    expect(schema.search.sort).toStrictEqual(['first_name', 'company']);
  });
});
