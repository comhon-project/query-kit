import { describe, it, expect } from 'vitest';

import { requester, registerRequester, _resetForTesting } from '@core/Requester';
import type { Requester } from '@core/Requester';

describe('Requester', () => {
  it('requester is initially undefined', () => {
    expect(requester).toBeUndefined();
  });

  it('registerRequester sets the requester', () => {
    const mockRequester: Requester = {
      request: async () => ({ collection: [], count: 0, limit: 25 }),
    };

    registerRequester(mockRequester);
    expect(requester).toBe(mockRequester);
  });

  it('registerRequester replaces a previously registered requester', () => {
    const first: Requester = {
      request: async () => ({ collection: [], count: 0, limit: 25 }),
    };
    const second: Requester = {
      request: async () => ({ collection: [{ id: 1 }], count: 1, limit: 25 }),
    };

    registerRequester(first);
    expect(requester).toBe(first);

    registerRequester(second);
    expect(requester).toBe(second);
  });

  it('_resetForTesting clears the requester back to undefined', () => {
    const mockRequester: Requester = {
      request: async () => ({ collection: [], count: 0, limit: 25 }),
    };

    registerRequester(mockRequester);
    expect(requester).toBeDefined();

    _resetForTesting();
    expect(requester).toBeUndefined();
  });
});
