export default {
  name: 'Utilisateur',
  properties: {
    first_name: 'prénom',
    last_name: 'nom',
    age: 'age',
    weight: 'poids',
    married: 'marié(e)',
    gender: 'genre',
    birth_date: 'date de naissance',
    birth_day: 'jour de naissance',
    birth_hour: 'heure de naissance',
    country: 'pays',
    company: 'companie',
    friend: 'ami(e)',
    favorite_fruits: 'fruits favoris',
    metadata: 'métadonnées',
  },
  entities: {
    metadata: {
      properties: {
        label: 'le libellé',
        description: 'la description',
        address: "l'adresse",
      },
    },
    address: {
      properties: {
        city: 'la ville',
        zip: 'le code postal',
      },
    },
  },
  scopes: {
    scope_string_definition: 'scope string définition',
    scope: 'scope sans valeur',
    string_scope: 'scope string',
    datetime_scope: 'scope date time',
    enum_scope: 'scope énum',
  },
};
