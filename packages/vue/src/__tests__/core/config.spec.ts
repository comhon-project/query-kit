import { describe, it, expect } from 'vitest';

import { config, applyOptions, _resetForTesting } from '@config/config';

describe('config', () => {
  it('has correct defaults', () => {
    expect(config.renderHtml).toBe(false);
    expect(config.userTimezone).toBe('UTC');
    expect(config.requestTimezone).toBe('UTC');
    expect(config.limit).toBeUndefined();
    expect(config.debounce).toBe(1000);
    expect(config.manual).toBe(false);
    expect(config.allowReset).toBe(true);
    expect(config.allowUndo).toBe(true);
    expect(config.allowRedo).toBe(true);
    expect(config.displayOperator).toBe(true);
    expect(config.quickSort).toBe(true);
    expect(config.displayCount).toBe(true);
    expect(config.editColumns).toBe(false);
    expect(config.allowedCollectionTypes).toEqual(['pagination']);
  });

  it('applyOptions sets values', () => {
    applyOptions({ renderHtml: true, userTimezone: 'Europe/Paris', limit: 25, manual: true });
    expect(config.renderHtml).toBe(true);
    expect(config.userTimezone).toBe('Europe/Paris');
    expect(config.limit).toBe(25);
    expect(config.manual).toBe(true);
  });

  it('applyOptions does not override when value is undefined', () => {
    applyOptions({ renderHtml: true });
    applyOptions({});
    expect(config.renderHtml).toBe(true);
  });

  it('_resetForTesting restores all defaults', () => {
    applyOptions({
      renderHtml: true,
      userTimezone: 'Europe/Paris',
      limit: 50,
      debounce: 500,
      manual: true,
      allowReset: false,
      displayCount: false,
      allowedCollectionTypes: ['infinite'],
    });

    _resetForTesting();

    expect(config.renderHtml).toBe(false);
    expect(config.userTimezone).toBe('UTC');
    expect(config.limit).toBeUndefined();
    expect(config.debounce).toBe(1000);
    expect(config.manual).toBe(false);
    expect(config.allowReset).toBe(true);
    expect(config.displayCount).toBe(true);
    expect(config.allowedCollectionTypes).toEqual(['pagination']);
  });
});
