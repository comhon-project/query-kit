export default {
  properties: {
    first_name: "first name",
    last_name: "last name",
    age: "the age",
    weight: "the weight",
    married: "is married",
    gender: "the gender",
    "birth.birth_date": "birth date",
    "birth.birth_day": "birth day",
    "birth.birth_hour": "birth hour",
    country: "the country",
    company: "the company",
    friend: "the friend",
    favorite_fruits: "favorite fruits",
    cars: "cars",
  },
  scopes: {
    scope_string_definition: "scope string definition",
    scope: "scope without value",
    string_scope: "string scope",
    datetime_scope: "datetime scope",
    enum_scope: "enum scope",
    multi_param_scope: "multi param scope",
  },
  parameters: {
    string_scope: {
      value: "value",
    },
    datetime_scope: {
      value: "value",
    },
    enum_scope: {
      value: "value",
    },
    multi_param_scope: {
      name: "name",
      min_age: "minimum age",
      fruits: "fruits",
    },
  },
};
