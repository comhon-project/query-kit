import type { Requester, RequestParams, RequestResponse } from '@core/types';

export type { Requester, RequestParams, RequestResponse };

let requester: Requester | undefined;

const registerRequester = (req: Requester): void => {
  requester = req;
};

function _resetForTesting(): void {
  requester = undefined;
}

export { registerRequester, requester, _resetForTesting };
