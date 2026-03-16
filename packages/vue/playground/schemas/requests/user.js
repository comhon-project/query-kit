export default {
  id: "user",
  filtrable: {
    properties: [
      "first_name",
      "age",
      "weight",
      "gender",
      "married",
      "birth_date",
      "birth_day",
      "birth_hour",
      "company",
      "friend",
      "country",
      "favorite_fruits",
      "tags",
      "cars",
      "profile",
      "does_not_exist",
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
  sortable: ["first_name", "company", "friend", "profile"],
  entities: {
    profile: {
      filtrable: {
        properties: ["bio", "nickname", "address"],
      },
      sortable: ["nickname"],
    },
    'profile.address': {
      filtrable: {
        properties: ["city", "zip_code", "street"],
      },
    },
  },
};
