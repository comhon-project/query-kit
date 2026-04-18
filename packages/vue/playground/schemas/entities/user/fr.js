export default {
  name: 'Utilisateur',
  properties: {
    first_name: "prénom",
    last_name: "nom",
    age: "âge",
    weight: "poids",
    married: "marié(e)",
    gender: "genre",
    birth_date: "date de naissance",
    birth_day: "jour de naissance",
    birth_hour: "heure de naissance",
    country: "pays",
    company: "entreprise",
    friend: "ami(e)",
    favorite_fruits: "fruits favoris",
    favorite_client: "client favori",
    cars: "voitures",
    profile: "profil",
  },
  entities: {
    profile: {
      properties: {
        bio: "biographie",
        nickname: "surnom",
        avatar_url: "URL de l'avatar",
        address: "adresse",
      },
    },
    'profile.address': {
      properties: {
        city: "ville",
        zip_code: "code postal",
        street: "rue",
      },
    },
  },
  scopes: {
    scope: "scope",
    string_scope: "scope texte",
  },
  parameters: {
    string_scope: {
      value: "valeur",
    },
  },
};
