let schemaLoader;
const computedRequests = {};

async function compute(id) {
  const loadedRequest = await schemaLoader.load(id);
  const requestSchema = structuredClone(loadedRequest);

  if (!requestSchema) return null;

  return requestSchema;
}

const registerLoader = (config) => {
  schemaLoader = config;
};

const resolve = (id) => {
  if (!computedRequests[id]) {
    computedRequests[id] = compute(id);
  }
  return computedRequests[id];
};

const getFiltrableProperties = async (entityId) => {
  const request = await resolve(entityId);
  return request?.filtrable?.properties ?? [];
};

const getFiltrableScopes = async (entityId) => {
  const request = await resolve(entityId);
  return request?.filtrable?.scopes ?? [];
};

const getSortableProperties = async (entityId) => {
  const request = await resolve(entityId);
  return request?.sortable ?? [];
};

export {
  registerLoader,
  resolve,
  getFiltrableProperties,
  getFiltrableScopes,
  getSortableProperties,
};
