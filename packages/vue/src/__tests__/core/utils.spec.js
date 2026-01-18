import { describe, it, expect } from 'vitest';

import { getUniqueId } from '@core/Utils';

describe('utils', () => {
  it('get unique id', () => {
    expect(getUniqueId()).toEqual(1);
    expect(getUniqueId()).toEqual(2);
    expect(getUniqueId()).toEqual(3);

    for (let index = 0; index < 100; index++) {
      getUniqueId();
    }
    expect(getUniqueId()).toEqual(104);
  });
});
