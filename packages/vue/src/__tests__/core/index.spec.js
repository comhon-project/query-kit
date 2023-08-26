import { describe, it, expect } from 'vitest';

import { plugin, locale } from '../../../index';

describe('index', () => {
  it('verify exports', () => {
    expect(plugin).toBeDefined();
    expect(locale.value).toBe('en');
  });
});
