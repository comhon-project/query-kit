import { describe, it, expect, afterEach } from 'vitest';

import { config, applyOptions, _resetForTesting } from '@config/config';

describe('config', () => {
  afterEach(() => {
    _resetForTesting();
  });

  it('has renderHtml defaulting to false', () => {
    expect(config.renderHtml).toBe(false);
  });

  it('applyOptions sets renderHtml to true', () => {
    applyOptions({ renderHtml: true });
    expect(config.renderHtml).toBe(true);
  });

  it('applyOptions sets renderHtml back to false', () => {
    applyOptions({ renderHtml: true });
    expect(config.renderHtml).toBe(true);

    applyOptions({ renderHtml: false });
    expect(config.renderHtml).toBe(false);
  });

  it('applyOptions throws when renderHtml is not a boolean', () => {
    expect(() => applyOptions({ renderHtml: 'yes' as unknown as boolean })).toThrow(
      'renderHtml must be a boolean',
    );
    expect(() => applyOptions({ renderHtml: 1 as unknown as boolean })).toThrow(
      'renderHtml must be a boolean',
    );
  });

  it('applyOptions does nothing when renderHtml is undefined', () => {
    applyOptions({ renderHtml: true });
    applyOptions({});
    expect(config.renderHtml).toBe(true);
  });

  it('_resetForTesting restores renderHtml to false', () => {
    applyOptions({ renderHtml: true });
    expect(config.renderHtml).toBe(true);

    _resetForTesting();
    expect(config.renderHtml).toBe(false);
  });
});
