export default {
  name: "user",
  properties: [
    {
      id: "id",
      name: "identifier",
      type: "string",
    },
    {
      id: "first_name",
      name: "first name",
      type: "string",
    },
    {
      id: "last_name",
      name: "last name",
      type: "string",
    },
    {
      id: "age",
      name: "the age",
      type: "integer",
    },
    {
      id: "weight",
      name: "the weight",
      type: "float",
    },
    {
      id: "married",
      name: "is married",
      type: "boolean",
    },
    {
      id: "gender",
      name: "the gender",
      type: "string",
      enum: {
        male: "Mr.",
        female: "Ms.",
      },
    },
    {
      id: "birth.birth_date",
      name: "birth date",
      type: "datetime",
    },
    {
      id: "birth.birth_day",
      name: "birth day",
      type: "date",
    },
    {
      id: "birth.birth_hour",
      name: "birth hour",
      type: "time",
    },
    {
      id: "country",
      name: "the country",
      type: "choice",
    },
    {
      id: "favorite_fruits",
      name: "favorite fruits",
      type: "array",
      children: {
        type: "string",
        enum: ["1", "2", "3"],
      },
    },
    {
      id: "company",
      name: "the company",
      type: "relationship",
      relationship_type: "belongs_to",
      model: "organization",
    },
    {
      id: "friend",
      name: "the friend",
      type: "relationship",
      relationship_type: "belongs_to",
      model: "user",
    },
    {
      id: "cars",
      name: "cars",
      type: "relationship",
      relationship_type: "has_many",
      model: "car",
    },
  ],
  unique_identifier: "id",
  primary_identifiers: ["last_name", "first_name"],
  natural_sort: ["last_name", "first_name"],
  search: {
    properties: [
      "first_name",
      "age",
      "weight",
      "gender",
      "married",
      "birth.birth_date",
      "birth.birth_day",
      "birth.birth_hour",
      "company",
      "friend",
      "country",
      "favorite_fruits",
      "cars",
    ],
    sort: ["first_name", "company", "friend"],
    scopes: [
      "scope_string_definition",
      {
        id: "scope",
        name: "scope without value",
      },
      {
        id: "string_scope",
        name: "string scope",
        type: "string",
        useOperator: true,
      },
      {
        id: "datetime_scope",
        name: "datetime scope",
        type: "datetime",
      },
      {
        id: "enum_scope",
        name: "enum scope",
        type: "string",
        enum: {
          one: "value one",
          two: "value two",
        },
      },
    ],
  },
};
