import cloneDeep from 'lodash.clonedeep';

let schemaLoader;
const computedSchemas = {};

async function compute(name) {
  let computed = null;
  const mapProperties = {}; 
  const mapScopes = {}; 
  const loadedSchema = cloneDeep(await schemaLoader.load(name));
  if (loadedSchema) {
    for (const property of loadedSchema.properties) {
      mapProperties[property.id] = property;
    }
    if (loadedSchema.search && loadedSchema.search.scopes && Array.isArray(loadedSchema.search.scopes)) {
      const scopes = []; 
      for (let scope of loadedSchema.search.scopes) {
        scope = typeof scope == 'object' ? scope : {id : scope, name : scope};
        mapScopes[scope.id] = scope;
        scopes.push(scope);
      }
      loadedSchema.search.scopes = scopes;
    }
    computed = Object.assign({ mapProperties, mapScopes }, loadedSchema);
  }
  return computed;
}

const registerLoader = (config) => {
  schemaLoader = config;
}

const resolve = (name) => {
  if (!computedSchemas[name]) {
    computedSchemas[name] = compute(name);
  }
  return computedSchemas[name];
};
  
export {
  registerLoader,
  resolve
};