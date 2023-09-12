import { reactive, ref, watch } from 'vue';
import { fallback, locale } from '../i18n/i18n';

let schemaLoader;
let schemaLocaleLoader;
const computedSchemas = {};

async function compute(name) {
  let computed = null;
  const mapProperties = {};
  const mapScopes = {};
  const loadedSchema = structuredClone(await schemaLoader.load(name));
  if (loadedSchema) {
    for (const property of loadedSchema.properties) {
      mapProperties[property.id] = property;
    }
    if (loadedSchema.search && loadedSchema.search.scopes && Array.isArray(loadedSchema.search.scopes)) {
      const scopes = [];
      for (let scope of loadedSchema.search.scopes) {
        scope = typeof scope == 'object' ? scope : { id: scope, name: scope };
        mapScopes[scope.id] = scope;
        scopes.push(scope);
      }
      loadedSchema.search.scopes = scopes;
    }
    computed = Object.assign({ mapProperties, mapScopes }, loadedSchema);
    computed.name = name;

    if (schemaLocaleLoader) {
      computed.translations = {};
      await computeLocales(computed, true);
    }
  }
  return computed;
}

async function computeLocales(schema, create) {
  const translations = await getTranslations(schema, locale.value);
  let fallbackTranslations = null;

  for (const map of [schema.mapProperties, schema.mapScopes]) {
    for (const key in map) {
      if (!Object.hasOwnProperty.call(map, key)) {
        continue;
      }
      const target = map[key];
      if (create) {
        target.name = ref(null);
      }
      target.name.value = translations[target.id];
      if (!target.name.value) {
        if (!fallbackTranslations) {
          fallbackTranslations = await getTranslations(schema, fallback.value);
        }
        target.name.value = fallbackTranslations[target.id];
      }
      if (!target.name.value) {
        console.warn(`translation not found for property ${schema.name}.${target.id}`);
        target.name.value = target.id;
      }
      let enumTarget = target;
      while (enumTarget.type == 'array') {
        enumTarget = target.children;
      }
      if (enumTarget.enum) {
        if (create) {
          const enumKeys = Array.isArray(enumTarget.enum) ? enumTarget.enum : Object.keys(enumTarget.enum);
          enumTarget.enum = reactive({});
          for (const key of enumKeys) {
            enumTarget.enum[key] = null;
          }
        }
        for (const key in enumTarget.enum) {
          let value = translations?.__enumerations__?.[target.id]?.[key];
          if (!value) {
            if (!fallbackTranslations) {
              fallbackTranslations = await getTranslations(schema, fallback.value);
            }
            value = fallbackTranslations?.__enumerations__?.[target.id]?.[key];
          }
          if (!value) {
            console.warn(`translation not found for enumeration ${schema.name}.${target.id}.${key}`);
            value = key;
          }
          enumTarget.enum[key] = value;
        }
      }
    }
  }
}

async function getPropertyPath(model, nestedProperty) {
  const propertyPath = [];
  const splited = nestedProperty.split('.');
  let propertyName = '';
  let currentSchema = await resolve(model);
  for (let i = 0; i < splited.length - 1; i++) {
    propertyName = propertyName.length ? `${propertyName}.${splited[i]}` : splited[i];
    const property = currentSchema.mapProperties[propertyName];
    if (!property) {
      continue;
    }
    propertyPath.push(property);
    currentSchema = await resolve(property.model);
    if (!currentSchema) {
      throw new Error(`invalid model "${property.model}"`);
    }
    propertyName = '';
  }
  const last = splited[splited.length - 1];
  propertyName = propertyName.length ? `${propertyName}.${last}` : last;
  if (!currentSchema.mapProperties[propertyName]) {
    throw new Error(`invalid collection property "${nestedProperty}"`);
  }
  propertyPath.push(currentSchema.mapProperties[propertyName]);
  return propertyPath;
}

async function getTranslations(schema, targetLocale) {
  if (!schema.translations[targetLocale]) {
    try {
      schema.translations[targetLocale] = await schemaLocaleLoader.load(schema.name, targetLocale);
    } catch (error) {
      schema.translations[targetLocale] = {};
    }
  }
  return schema.translations[targetLocale];
}

const registerLoader = (config) => {
  schemaLoader = config;
};

const registerLocaleLoader = (config) => {
  schemaLocaleLoader = config;
};

const resolve = (name) => {
  if (!computedSchemas[name]) {
    computedSchemas[name] = compute(name);
  }
  return computedSchemas[name];
};

watch(locale, () => {
  if (schemaLocaleLoader) {
    for (const name in computedSchemas) {
      if (!Object.hasOwnProperty.call(computedSchemas, name)) {
        continue;
      }
      computedSchemas[name].then((schema) => computeLocales(schema, false));
    }
  }
});

export { registerLoader, registerLocaleLoader, resolve, getPropertyPath };
