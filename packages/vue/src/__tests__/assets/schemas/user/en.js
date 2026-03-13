export default {
  name: 'User',
  properties: {
    first_name: 'first name',
    last_name: 'last name',
    age: 'the age',
    weight: 'the weight',
    married: 'is married',
    gender: 'the gender',
    birth_date: 'birth date',
    birth_day: 'birth day',
    birth_hour: 'birth hour',
    country: 'the country',
    company: 'the company',
    friend: 'the friend',
    favorite_fruits: 'favorite fruits',
    metadata: 'metadata',
  },
  entities: {
    metadata: {
      properties: {
        label: 'the label',
        description: 'the description',
        address: 'the address',
      },
    },
    address: {
      properties: {
        city: 'the city',
        zip: 'the zip',
      },
    },
  },
  scopes: {
    scope_string_definition: 'scope string definition',
    scope: 'scope without value',
    string_scope: 'string scope',
    datetime_scope: 'datetime scope',
    enum_scope: 'enum scope',
  },
};
