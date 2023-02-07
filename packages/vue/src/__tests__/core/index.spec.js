import { describe, it, expect } from 'vitest';

import { plugin, locale, Search, Builder, Collection } from '../../../index';

describe('index', () => {
  it('verify exports', () => {
    expect(plugin).toBeDefined();
    expect(Search).toBeDefined();
    expect(Builder).toBeDefined();
    expect(Collection).toBeDefined();
    expect(locale.value).toBe('en');
  });
});
