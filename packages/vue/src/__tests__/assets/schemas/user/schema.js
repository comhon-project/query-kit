export default {
  id: 'user',
  name: 'user',
  properties: [
    {
      id: 'id',
      name: 'identifier',
      type: 'string',
    },
    {
      id: 'first_name',
      name: 'first name',
      type: 'string',
    },
    {
      id: 'last_name',
      name: 'last name',
      type: 'string',
    },
    {
      id: 'age',
      name: 'the age',
      type: 'integer',
    },
    {
      id: 'weight',
      name: 'the weight',
      type: 'float',
    },
    {
      id: 'married',
      name: 'is married',
      type: 'boolean',
    },
    {
      id: 'gender',
      name: 'the gender',
      type: 'string',
      enum: 'gender',
    },
    {
      id: 'birth_date',
      name: 'birth date',
      type: 'datetime',
    },
    {
      id: 'birth_day',
      name: 'birth day',
      type: 'date',
    },
    {
      id: 'birth_hour',
      name: 'birth hour',
      type: 'time',
    },
    {
      id: 'country',
      name: 'the country',
      type: 'choice',
    },
    {
      id: 'favorite_fruits',
      name: 'favorite fruits',
      type: 'array',
      children: {
        type: 'string',
        enum: 'fruit',
      },
    },
    {
      id: 'company',
      name: 'the company',
      type: 'relationship',
      relationship_type: 'belongs_to',
      related: 'organization',
    },
    {
      id: 'friend',
      name: 'the friend',
      type: 'relationship',
      relationship_type: 'belongs_to',
      related: 'user',
    },
  ],
  unique_identifier: 'id',
  primary_identifiers: ['last_name', 'first_name'],
  scopes: [
    {
      id: 'scope_string_definition',
      parameters: [],
    },
    {
      id: 'scope',
      parameters: [],
    },
    {
      id: 'string_scope',
      parameters: [
        {
          id: 'value',
          name: 'string scope',
          type: 'string',
          nullable: false,
        },
      ],
    },
    {
      id: 'datetime_scope',
      parameters: [
        {
          id: 'value',
          name: 'datetime scope',
          type: 'datetime',
          nullable: false,
        },
      ],
    },
    {
      id: 'enum_scope',
      parameters: [
        {
          id: 'value',
          name: 'enum scope',
          type: 'string',
          enum: 'enum_scope_values',
          nullable: false,
        },
      ],
    },
  ],
};
