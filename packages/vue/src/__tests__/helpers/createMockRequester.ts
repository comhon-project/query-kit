import { vi } from 'vitest';
import type { RequestParams, RequestResponse } from '@core/types';

export function createMockRequester(
  response: Partial<RequestResponse> = {},
  delay = 0,
) {
  const calls: RequestParams[] = [];
  return {
    requester: {
      request: vi.fn(async (params: RequestParams) => {
        calls.push(params);
        if (delay) await new Promise((r) => setTimeout(r, delay));
        return {
          collection: response.collection ?? [],
          count: response.count ?? 0,
          limit: response.limit ?? 25,
        };
      }),
    },
    calls,
  };
}
