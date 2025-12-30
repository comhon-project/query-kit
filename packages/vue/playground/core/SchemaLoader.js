const schemaLoader = async (name) => {
  return (await import(`../schemas/${name}/schema.js`)).default;
};

const schemaLocaleLoader = async (name, locale) => {
  return (await import(`../schemas/${name}/${locale}.js`)).default;
};

export { schemaLoader, schemaLocaleLoader };
