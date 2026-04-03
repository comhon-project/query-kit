export default {
  id: 'user',
  name: 'user',
  properties: [
    {
      id: 'id',
      name: 'identifier',
      type: 'string',
      nullable: false,
    },
    {
      id: 'first_name',
      name: 'first name',
      type: 'string',
      nullable: false,
    },
    {
      id: 'last_name',
      name: 'last name',
      type: 'string',
      nullable: false,
    },
    {
      id: 'age',
      name: 'the age',
      type: 'integer',
      nullable: true,
    },
    {
      id: 'weight',
      name: 'the weight',
      type: 'float',
      nullable: true,
    },
    {
      id: 'married',
      name: 'is married',
      type: 'boolean',
      nullable: true,
    },
    {
      id: 'gender',
      name: 'the gender',
      type: 'string',
      enum: 'gender',
      nullable: true,
    },
    {
      id: 'birth_date',
      name: 'birth date',
      type: 'datetime',
      nullable: true,
    },
    {
      id: 'birth_day',
      name: 'birth day',
      type: 'date',
      nullable: true,
    },
    {
      id: 'birth_hour',
      name: 'birth hour',
      type: 'time',
      nullable: true,
    },
    {
      id: 'country',
      name: 'the country',
      type: 'country',
      nullable: true,
    },
    {
      id: 'favorite_fruits',
      name: 'favorite fruits',
      type: 'array',
      items: {
        type: 'string',
        enum: 'fruit',
      },
      nullable: true,
    },
    {
      id: 'tags',
      name: 'tags',
      type: 'array',
      items: {
        type: 'string',
      },
      nullable: true,
    },
    {
      id: 'company',
      name: 'the company',
      type: 'relationship',
      relationship_type: 'belongs_to',
      entity: 'organization',
    },
    {
      id: 'friend',
      name: 'the friend',
      type: 'relationship',
      relationship_type: 'belongs_to',
      entity: 'user',
    },
    {
      id: 'cars',
      name: 'cars',
      type: 'relationship',
      relationship_type: 'has_many',
      entity: 'car',
    },
    {
      id: 'profile',
      name: 'profile',
      type: 'object',
      entity: 'user.profile',
    },
  ],
  entities: {
    profile: {
      properties: [
        {
          id: 'bio',
          name: 'bio',
          type: 'string',
        },
        {
          id: 'nickname',
          name: 'nickname',
          type: 'string',
        },
        {
          id: 'avatar_url',
          name: 'avatar url',
          type: 'string',
        },
        {
          id: 'address',
          name: 'address',
          type: 'object',
          entity: 'user.profile.address',
        },
      ],
      natural_sort: ['nickname'],
    },
    'profile.address': {
      properties: [
        {
          id: 'city',
          name: 'city',
          type: 'string',
        },
        {
          id: 'zip_code',
          name: 'zip code',
          type: 'string',
        },
        {
          id: 'street',
          name: 'street',
          type: 'string',
        },
      ],
    },
  },
  unique_identifier: 'id',
  primary_identifiers: ['last_name', 'first_name'],
  natural_sort: ['last_name', 'first_name'],
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
          name: 'value',
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
          name: 'value',
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
          name: 'value',
          type: 'string',
          enum: 'enum_scope_values',
          nullable: false,
        },
      ],
    },
    {
      id: 'multi_param_scope',
      parameters: [
        {
          id: 'name',
          name: 'name',
          type: 'string',
          nullable: false,
        },
        {
          id: 'min_age',
          name: 'min age',
          type: 'integer',
          nullable: true,
        },
        {
          id: 'fruits',
          name: 'fruits',
          type: 'array',
          items: {
            type: 'string',
            enum: 'fruit',
          },
          nullable: false,
        },
      ],
    },
  ],
};
