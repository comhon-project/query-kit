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
const computedRequests: Record<string, Promise<RequestSchema>> = {};

async function compute(id: string): Promise<RequestSchema> {
  if (!schemaLoader) {
    throw new Error('Request schema loader not configured');
  }
  const loadedRequest = await schemaLoader.load(id);
  const requestSchema = structuredClone(loadedRequest);

  if (!requestSchema) throw new Error(`Request schema "${id}" not found`);

  return requestSchema;
}

const registerLoader = (config: SchemaLoader): void => {
  schemaLoader = config;
};

const resolve = (id: string): Promise<RequestSchema> => {
  if (!computedRequests[id]) {
    computedRequests[id] = compute(id);
  }
  return computedRequests[id];
};

const getFiltrableProperties = async (entityId: string): Promise<string[]> => {
  const request = await resolve(entityId);
  return request.filtrable?.properties ?? [];
};

const getFiltrableScopes = async (entityId: string): Promise<string[]> => {
  const request = await resolve(entityId);
  return request.filtrable?.scopes ?? [];
};

const getSortableProperties = async (entityId: string): Promise<string[]> => {
  const request = await resolve(entityId);
  return request.sortable ?? [];
};

export {
  registerLoader,
  resolve,
  getFiltrableProperties,
  getFiltrableScopes,
  getSortableProperties,
};
