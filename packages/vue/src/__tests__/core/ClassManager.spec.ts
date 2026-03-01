import { describe, it, expect, afterEach } from 'vitest';

import { classes, registerClasses, _resetForTesting } from '@core/ClassManager';

describe('ClassManager', () => {
  afterEach(() => {
    _resetForTesting();
  });

  describe('default classes', () => {
    it('has the modal class', () => {
      expect(classes.modal).toBe('qkit-modal');
    });

    it('has the search class', () => {
      expect(classes.search).toBe('qkit-search');
    });

    it('has the builder class', () => {
      expect(classes.builder).toBe('qkit-builder');
    });

    it('has the btn class', () => {
      expect(classes.btn).toBe('qkit-btn');
    });

    it('has the collection class', () => {
      expect(classes.collection).toBe('qkit-collection');
    });

    it('has the pagination class', () => {
      expect(classes.pagination).toBe('qkit-pagination');
    });

    it('has the loading class', () => {
      expect(classes.loading).toBe('qkit-loading');
    });
  });

  describe('registerClasses', () => {
    it('overrides a specific class', () => {
      registerClasses({ modal: 'custom-modal' });
      expect(classes.modal).toBe('custom-modal');
    });

    it('overrides multiple classes at once', () => {
      registerClasses({
        modal: 'my-modal',
        btn: 'my-btn',
      });
      expect(classes.modal).toBe('my-modal');
      expect(classes.btn).toBe('my-btn');
    });

    it('does not affect unmodified classes', () => {
      registerClasses({ modal: 'custom-modal' });
      expect(classes.search).toBe('qkit-search');
      expect(classes.builder).toBe('qkit-builder');
    });
  });

  describe('read-only proxy', () => {
    it('throws when attempting to set a property on classes', () => {
      expect(() => {
        (classes as Record<string, string>).modal = 'hacked';
      }).toThrow('classes are read only');
    });
  });

  describe('_resetForTesting', () => {
    it('restores overridden classes to their defaults', () => {
      registerClasses({ modal: 'custom-modal', btn: 'custom-btn' });
      expect(classes.modal).toBe('custom-modal');
      expect(classes.btn).toBe('custom-btn');

      _resetForTesting();
      expect(classes.modal).toBe('qkit-modal');
      expect(classes.btn).toBe('qkit-btn');
    });
  });
});
