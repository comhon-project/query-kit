export interface RequesterQuery {
  entity: string;
  filter?: Record<string, unknown>;
  limit: number;
  offset: number;
  orderBy?: string[];
}

export interface RequesterResponse {
  count: number;
  collection: Record<string, unknown>[];
}

export interface Requester {
  request: (query: RequesterQuery) => Promise<RequesterResponse>;
}

let requester: Requester | undefined;

const registerRequester = (req: Requester): void => {
  requester = req;
};

export { registerRequester, requester };
