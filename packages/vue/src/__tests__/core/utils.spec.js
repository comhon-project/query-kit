import { describe, it, expect } from 'vitest';

import Utils from '../../core/Utils';

describe('utils', () => {
  it('get unique id', () => {
    expect(Utils.getUniqueId()).toEqual(1);
    expect(Utils.getUniqueId()).toEqual(2);
    expect(Utils.getUniqueId()).toEqual(3);

    for (let index = 0; index < 100; index++) {
      Utils.getUniqueId();
    }
    expect(Utils.getUniqueId()).toEqual(104);
  });
});
