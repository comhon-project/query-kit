import { describe, it, expect } from 'vitest';
import { plugin, locale, MultipleCapableComponent } from '../../index';

describe('Public API exports', () => {
  it('exports plugin', () => {
    expect(plugin).toBeDefined();
    expect(typeof plugin.install).toBe('function');
  });

  it('exports locale as a ref', () => {
    expect(locale).toBeDefined();
    expect(locale.value).toBe('en');
  });

  it('exports MultipleCapableComponent class', () => {
    expect(MultipleCapableComponent).toBeDefined();
    const instance = new MultipleCapableComponent('text');
    expect(instance.component).toBe('text');
  });
});
