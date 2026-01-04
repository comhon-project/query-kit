const entitySchemaLoader = async (id) => {
  return (await import(`../schemas/entities/${id}/schema.js`)).default;
};

const entityTranslationsLoader = async (id, locale) => {
  return (await import(`../schemas/entities/${id}/${locale}.js`)).default;
};

const enumSchemaLoader = async (id) => {
  return (await import(`../schemas/enums/${id}/schema.js`)).default;
};

const enumTranslationsLoader = async (id, locale) => {
  return (await import(`../schemas/enums/${id}/${locale}.js`)).default;
};

const requestSchemaLoader = async (id) => {
  return (await import(`../schemas/requests/${id}.js`)).default;
};

export { entitySchemaLoader, entityTranslationsLoader, enumSchemaLoader, enumTranslationsLoader, requestSchemaLoader };
