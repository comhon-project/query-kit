export default {
  first_name: 'prénom',
  last_name: 'nom',
  age: 'age',
  weight: 'poids',
  married: 'marié(e)',
  gender: 'genre',
  'birth.birth_date': 'date de naissance',
  'birth.birth_day': 'jour de naissance',
  'birth.birth_hour': 'heure de naissance',
  country: 'pays',
  company: 'companie',
  friend: 'ami(e)',
  favorite_fruits: 'fruits favoris',

  scope_string_definition: 'scope string définition',
  scope: 'scope sans valeur',
  string_scope: 'scope string',
  datetime_scope: 'scope date time',
  enum_scope: 'scope énum',

  __enumerations__: {
    gender: {
      male: 'M.',
      female: 'Mme.',
    },
    favorite_fruits: {
      1: 'pomme',
      2: 'orange',
      3: 'pastèque',
    },
    enum_scope: {
      one: 'valeur un',
      two: 'valeur deux',
    },
  },
};
