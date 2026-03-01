import type { RequestSchema } from '@core/RequestSchema';

const requestSchemas: Record<string, RequestSchema> = {
  user: {
    filtrable: {
      properties: ['first_name', 'last_name', 'age', 'gender', 'married', 'birth_date', 'company', 'favorite_fruits'],
      scopes: ['scope', 'string_scope', 'datetime_scope', 'enum_scope'],
    },
    sortable: ['first_name', 'last_name', 'age'],
  },
  organization: {
    filtrable: {
      properties: ['brand_name'],
      scopes: [],
    },
    sortable: ['brand_name'],
  },
};

export const requestSchemaLoader = {
  load: async (id: string) => requestSchemas[id] ?? null,
};
