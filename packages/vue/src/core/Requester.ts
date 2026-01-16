import type { Requester, RequestParams, RequestResponse } from '@core/types';

export type { Requester, RequestParams, RequestResponse };

let requester: Requester | undefined;

const registerRequester = (req: Requester): void => {
  requester = req;
};

export { registerRequester, requester };
