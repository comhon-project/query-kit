import { describe, it, expect, afterEach } from 'vitest';

import {
  icons,
  registerIcons,
  iconComponent,
  iconPropName,
  defaultIcons,
  _resetForTesting,
} from '@core/IconManager';

describe('IconManager', () => {
  afterEach(() => {
    _resetForTesting();
  });

  describe('initial state', () => {
    it('icons proxy returns undefined for any key initially', () => {
      expect(icons.add).toBeUndefined();
      expect(icons.delete).toBeUndefined();
      expect(icons.search).toBeUndefined();
    });

    it('iconComponent defaults to "i"', () => {
      expect(iconComponent).toBe('i');
    });

    it('iconPropName defaults to "class"', () => {
      expect(iconPropName).toBe('class');
    });
  });

  describe('defaultIcons', () => {
    const expectedKeys = [
      'add',
      'add_filter',
      'add_value',
      'delete',
      'close',
      'previous',
      'next',
      'collapse',
      'sort',
      'minus',
      'undo',
      'redo',
      'reset',
      'search',
      'confirm',
      'export',
      'columns',
      'grip',
      'paginated_list',
      'infinite_list',
      'loading',
    ];

    it('has all 21 expected icon keys', () => {
      for (const key of expectedKeys) {
        expect(defaultIcons).toHaveProperty(key);
      }
      expect(Object.keys(defaultIcons)).toHaveLength(21);
    });

    it('each default icon has a class and component property', () => {
      for (const key of expectedKeys) {
        const icon = defaultIcons[key as keyof typeof defaultIcons];
        expect(icon).toBeDefined();
        expect(icon!.class).toEqual(expect.any(String));
        expect(icon!.component).toBe('i');
      }
    });
  });

  describe('registerIcons', () => {
    it('adds icons to the icon list', () => {
      registerIcons({
        add: { class: 'fa fa-plus' },
        delete: { class: 'fa fa-trash' },
      });
      expect(icons.add).toEqual({ class: 'fa fa-plus' });
      expect(icons.delete).toEqual({ class: 'fa fa-trash' });
    });

    it('sets a custom component', () => {
      registerIcons({ add: { class: 'fa fa-plus' } }, 'font-awesome-icon');
      expect(iconComponent).toBe('font-awesome-icon');
    });

    it('sets a custom propName', () => {
      registerIcons({ add: { class: 'fa fa-plus' } }, 'font-awesome-icon', 'icon');
      expect(iconPropName).toBe('icon');
    });

    it('defaults component to "i" and propName to "class" when not specified', () => {
      registerIcons({ add: { class: 'custom-icon' } });
      expect(iconComponent).toBe('i');
      expect(iconPropName).toBe('class');
    });
  });

  describe('read-only proxy', () => {
    it('throws when attempting to set a property on icons', () => {
      expect(() => {
        (icons as Record<string, unknown>).add = { class: 'hacked' };
      }).toThrow('icons are read only');
    });
  });

  describe('_resetForTesting', () => {
    it('clears all registered icons', () => {
      registerIcons({
        add: { class: 'fa fa-plus' },
        delete: { class: 'fa fa-trash' },
      });
      expect(icons.add).toBeDefined();

      _resetForTesting();
      expect(icons.add).toBeUndefined();
      expect(icons.delete).toBeUndefined();
    });

    it('resets iconComponent to "i"', () => {
      registerIcons({ add: { class: 'fa fa-plus' } }, 'font-awesome-icon');
      expect(iconComponent).toBe('font-awesome-icon');

      _resetForTesting();
      expect(iconComponent).toBe('i');
    });

    it('resets iconPropName to "class"', () => {
      registerIcons({ add: { class: 'fa fa-plus' } }, 'span', 'icon');
      expect(iconPropName).toBe('icon');

      _resetForTesting();
      expect(iconPropName).toBe('class');
    });
  });
});
