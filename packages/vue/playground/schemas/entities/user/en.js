export default {
  name: 'User',
  properties: {
    first_name: "first name",
    last_name: "last name",
    age: "age",
    weight: "weight",
    married: "is married",
    gender: "gender",
    birth_date: "birth date",
    birth_day: "birth day",
    birth_hour: "birth hour",
    country: "country",
    company: "company",
    friend: "friend",
    favorite_fruits: "favorite fruits",
    favorite_client: "favorite client",
    cars: "cars",
    profile: "profile",
  },
  entities: {
    profile: {
      properties: {
        bio: "bio",
        nickname: "nickname",
        avatar_url: "avatar URL",
        address: "address",
      },
    },
    'profile.address': {
      properties: {
        city: "city",
        zip_code: "zip code",
        street: "street",
      },
    },
  },
  scopes: {
    scope: "scope",
    string_scope: "string scope",
  },
  parameters: {
    string_scope: {
      value: "value",
    },
  },
};
