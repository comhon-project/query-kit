import { describe, it, expect } from 'vitest';
import {
  plugin,
  locale,
  InputComponent,
  getEntitySchema,
  getEntityTranslation,
  getPropertyTranslation,
  getScopeTranslation,
  getScopeParameterTranslation,
} from '../../index';

describe('Public API exports', () => {
  it('exports plugin', () => {
    expect(plugin).toBeDefined();
    expect(typeof plugin.install).toBe('function');
  });

  it('exports locale as a ref', () => {
    expect(locale).toBeDefined();
    expect(locale.value).toBe('en');
  });

  it('exports InputComponent class', () => {
    expect(InputComponent).toBeDefined();
    const instance = new InputComponent('text', { multiple: true });
    expect(instance.component).toBe('text');
    expect(instance.settings).toEqual({ multiple: true });
  });

  it('exports getEntitySchema', () => {
    expect(typeof getEntitySchema).toBe('function');
  });

  it('exports translation functions', () => {
    expect(typeof getEntityTranslation).toBe('function');
    expect(typeof getPropertyTranslation).toBe('function');
    expect(typeof getScopeTranslation).toBe('function');
    expect(typeof getScopeParameterTranslation).toBe('function');
  });
});
