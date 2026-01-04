export default {
  id: "user",
  filtrable: {
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
    scopes: [
      "scope_string_definition",
      "scope",
      "string_scope",
      "datetime_scope",
      "enum_scope",
      "multi_param_scope",
    ],
  },
  sortable: ["first_name", "company", "friend"],
};
