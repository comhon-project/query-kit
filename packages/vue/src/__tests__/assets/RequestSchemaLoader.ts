import type { RequestSchema } from '@core/RequestSchema';

const requestSchemas: Record<string, RequestSchema> = {
  user: {
    filtrable: {
      properties: ['first_name', 'last_name', 'age', 'gender', 'married', 'birth_date', 'company', 'favorite_fruits', 'favorite_client', 'worst_client', 'metadata'],
      scopes: ['scope', 'string_scope', 'datetime_scope', 'enum_scope'],
    },
    sortable: ['first_name', 'last_name', 'age', 'metadata'],
    entities: {
      metadata: {
        filtrable: {
          properties: ['label', 'address'],
          scopes: [],
        },
        sortable: [],
      },
      address: {
        filtrable: {
          properties: ['city', 'zip'],
          scopes: [],
        },
        sortable: [],
      },
    },
  },
  organization: {
    filtrable: {
      properties: ['brand_name', 'country'],
      scopes: ['scope'],
    },
    sortable: ['brand_name'],
  },
};

export const requestSchemaLoader = {
  load: async (id: string) => requestSchemas[id] ?? null,
};
