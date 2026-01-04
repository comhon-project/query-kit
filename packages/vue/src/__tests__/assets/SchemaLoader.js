import userEn from '@tests/assets/schemas/user/en';
import userFr from '@tests/assets/schemas/user/fr';
import userEs from '@tests/assets/schemas/user/es';
import user from '@tests/assets/schemas/user/schema';

import orgaEn from '@tests/assets/schemas/organization/en';
import orgaFr from '@tests/assets/schemas/organization/fr';
import orgaEs from '@tests/assets/schemas/organization/es';
import organization from '@tests/assets/schemas/organization/schema';

import genderSchema from '@tests/assets/schemas/enums/gender/schema';
import genderEn from '@tests/assets/schemas/enums/gender/en';
import genderFr from '@tests/assets/schemas/enums/gender/fr';
import genderEs from '@tests/assets/schemas/enums/gender/es';

import fruitSchema from '@tests/assets/schemas/enums/fruit/schema';
import fruitEn from '@tests/assets/schemas/enums/fruit/en';
import fruitFr from '@tests/assets/schemas/enums/fruit/fr';

import enumScopeValuesSchema from '@tests/assets/schemas/enums/enum_scope_values/schema';
import enumScopeValuesEn from '@tests/assets/schemas/enums/enum_scope_values/en';
import enumScopeValuesFr from '@tests/assets/schemas/enums/enum_scope_values/fr';

const entitySchemas = {
  user,
  organization,
};

const entityLocales = {
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

const enumSchemas = {
  gender: genderSchema,
  fruit: fruitSchema,
  enum_scope_values: enumScopeValuesSchema,
};

const enumLocales = {
  gender: {
    en: genderEn,
    fr: genderFr,
    es: genderEs,
  },
  fruit: {
    en: fruitEn,
    fr: fruitFr,
  },
  enum_scope_values: {
    en: enumScopeValuesEn,
    fr: enumScopeValuesFr,
  },
};

const entitySchemaLoader = {
  load: async (name) => {
    return entitySchemas[name];
  },
};

const entityTranslationsLoader = {
  load: async (name, locale) => {
    return entityLocales[name]?.[locale] ?? null;
  },
};

const enumSchemaLoader = {
  load: async (name) => {
    return enumSchemas[name];
  },
};

const enumTranslationsLoader = {
  load: async (name, locale) => {
    return enumLocales[name]?.[locale] ?? null;
  },
};

export { entitySchemaLoader, entityTranslationsLoader, enumSchemaLoader, enumTranslationsLoader };
