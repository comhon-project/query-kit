import userEn from "./schemas/user/en";
import userFr from "./schemas/user/fr";
import userEs from "./schemas/user/es";
import user from "./schemas/user/schema";

import orgaEn from "./schemas/organization/en";
import orgaFr from "./schemas/organization/fr";
import orgaEs from "./schemas/organization/es";
import organization from "./schemas/organization/schema";

const schemas = {
    user,
    organization
}

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
    }
}

const schemaLoader = {
    load: async (name) => {
        return schemas[name];
    }
}

const schemaLocaleLoader = {
    load: async (name, locale) => {
        return locales[name] ? locales[name][locale] : null;
    }
}

export {
    schemaLoader,
    schemaLocaleLoader
};