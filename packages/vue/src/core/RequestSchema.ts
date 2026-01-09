export interface RequestSchema {
  filtrable?: {
    properties?: string[];
    scopes?: string[];
  };
  sortable?: string[];
}

export interface SchemaLoader {
  load: (id: string) => Promise<RequestSchema | null>;
}

let schemaLoader: SchemaLoader | undefined;
const computedRequests: Record<string, Promise<RequestSchema | null>> = {};

async function compute(id: string): Promise<RequestSchema | null> {
  if (!schemaLoader) {
    return null;
  }
  const loadedRequest = await schemaLoader.load(id);
  const requestSchema = structuredClone(loadedRequest);

  if (!requestSchema) return null;

  return requestSchema;
}

const registerLoader = (config: SchemaLoader): void => {
  schemaLoader = config;
};

const resolve = (id: string): Promise<RequestSchema | null> => {
  if (!computedRequests[id]) {
    computedRequests[id] = compute(id);
  }
  return computedRequests[id];
};

const getFiltrableProperties = async (entityId: string): Promise<string[]> => {
  const request = await resolve(entityId);
  return request?.filtrable?.properties ?? [];
};

const getFiltrableScopes = async (entityId: string): Promise<string[]> => {
  const request = await resolve(entityId);
  return request?.filtrable?.scopes ?? [];
};

const getSortableProperties = async (entityId: string): Promise<string[]> => {
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
