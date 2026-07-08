import type { Requester, RequestParams, RequestResponse } from '@core/types';

export type { Requester, RequestParams, RequestResponse };

let requester: Requester | undefined;
let requestErrorHandler: ((error: unknown) => void) | undefined;

const registerRequester = (req: Requester): void => {
  requester = req;
};

const registerRequestErrorHandler = (fn?: (error: unknown) => void): void => {
  requestErrorHandler = fn;
};

function _resetForTesting(): void {
  requester = undefined;
  requestErrorHandler = undefined;
}

export {
  registerRequester,
  registerRequestErrorHandler,
  requester,
  requestErrorHandler, 
  _resetForTesting
};
