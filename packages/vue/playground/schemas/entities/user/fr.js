export default {
  properties: {
    first_name: "prénom",
    last_name: "nom",
    age: "age",
    weight: "poids",
    married: "marié(e)",
    gender: "genre",
    birth_date: "date de naissance",
    birth_day: "jour de naissance",
    birth_hour: "heure de naissance",
    country: "pays",
    company: "companie",
    friend: "ami(e)",
    favorite_fruits: "fruits favoris",
    cars: "voitures",
  },
  scopes: {
    scope_string_definition: "scope string définition",
    scope: "scope sans valeur",
    string_scope: "scope string",
    datetime_scope: "scope date time",
    enum_scope: "scope énum",
    multi_param_scope: "scope multi paramètres",
  },
  parameters: {
    string_scope: {
      value: "valeur",
    },
    datetime_scope: {
      value: "valeur",
    },
    enum_scope: {
      value: "valeur",
    },
    multi_param_scope: {
      name: "nom",
      min_age: "âge minimum",
      fruits: "fruits",
    },
  },
};
