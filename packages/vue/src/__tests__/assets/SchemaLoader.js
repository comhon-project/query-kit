import userEn from '@tests/assets/schemas/user/en';
import userFr from '@tests/assets/schemas/user/fr';
import userEs from '@tests/assets/schemas/user/es';
import user from '@tests/assets/schemas/user/schema';

import orgaEn from '@tests/assets/schemas/organization/en';
import orgaFr from '@tests/assets/schemas/organization/fr';
import orgaEs from '@tests/assets/schemas/organization/es';
import organization from '@tests/assets/schemas/organization/schema';

const schemas = {
  user,
  organization,
};

const locales = {
  user: {
    en: userEn,
    fr: userFr,
    es: userEs,
  },
  organization: {
    en: orgaEn,
    fr: orgaFr,
    es: orgaEs,
  },
};

const schemaLoader = {
  load: async (name) => {
    return schemas[name];
  },
};

const schemaLocaleLoader = {
  load: async (name, locale) => {
    return locales[name] ? locales[name][locale] : null;
  },
};

export { schemaLoader, schemaLocaleLoader };
