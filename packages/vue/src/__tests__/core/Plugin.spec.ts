import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp, defineComponent } from 'vue';
import type { App } from 'vue';

import plugin from '@core/Plugin';
import { requester } from '@core/Requester';
import { icons, defaultIcons } from '@core/IconManager';
import { classes } from '@core/ClassManager';
import { getComponent } from '@core/InputManager';
import { config } from '@config/config';
import { getTypeRenderer, getPropertyRenderer } from '@core/CellRendererManager';
import { locale, fallback } from '@i18n/i18n';
import {
  entitySchemaLoader,
  entityTranslationsLoader,
  enumSchemaLoader,
  enumTranslationsLoader,
} from '@tests/assets/SchemaLoader';
import requesterConfig from '@tests/assets/Requester';
import BooleanInput from '@components/Common/BooleanInput.vue';
import SelectEnum from '@components/Common/SelectEnum.vue';
import DateTimeInput from '@components/Common/DateTimeInput.vue';

let app: App;
let componentSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  app = createApp(defineComponent({ render: () => null }));
  componentSpy = vi.spyOn(app, 'component');
});

afterEach(() => {
  componentSpy.mockRestore();
});

describe('Plugin', () => {
  it('plugin.install is a function', () => {
    expect(plugin).toBeDefined();
    expect(typeof plugin.install).toBe('function');
  });

  it('throws when no options passed', () => {
    expect(() => (plugin as any).install(app)).toThrowError('must have at least required configs');
  });

  describe('requester validation', () => {
    it('throws with a number', () => {
      expect(() => plugin.install(app, { requester: 1, entitySchemaLoader: () => Promise.resolve(null) } as any)).toThrowError(
        'invalid requester',
      );
    });

    it('throws with an empty object', () => {
      expect(() => plugin.install(app, { requester: {}, entitySchemaLoader: () => Promise.resolve(null) } as any)).toThrowError(
        'invalid requester',
      );
    });

    it('accepts a function', () => {
      expect(() =>
        plugin.install(app, { requester: () => Promise.resolve({ count: 0, collection: [] }), entitySchemaLoader: () => Promise.resolve(null) } as any),
      ).not.toThrow();
    });

    it('accepts {request: fn}', () => {
      expect(() =>
        plugin.install(app, { requester: { request: () => Promise.resolve({ count: 0, collection: [] }) }, entitySchemaLoader: () => Promise.resolve(null) } as any),
      ).not.toThrow();
    });
  });

  describe('entitySchemaLoader validation', () => {
    it('required - throws when missing', () => {
      expect(() => plugin.install(app, {} as any)).toThrowError('entitySchemaLoader config is required');
    });

    it('throws with a number', () => {
      expect(() => plugin.install(app, { entitySchemaLoader: 1 } as any)).toThrowError(
        'invalid entity schema loader',
      );
    });

    it('throws with an empty object', () => {
      expect(() => plugin.install(app, { entitySchemaLoader: {} } as any)).toThrowError(
        'invalid entity schema loader',
      );
    });

    it('accepts a function (wraps in {load: fn})', () => {
      expect(() => plugin.install(app, { entitySchemaLoader: () => Promise.resolve(null) } as any)).not.toThrow();
    });

    it('accepts {load: fn} object', () => {
      expect(() =>
        plugin.install(app, { entitySchemaLoader: { load: () => Promise.resolve(null) } }),
      ).not.toThrow();
    });
  });

  describe('entityTranslationsLoader validation', () => {
    it('throws with a number', () => {
      expect(() =>
        plugin.install(app, { entitySchemaLoader: () => Promise.resolve(null), entityTranslationsLoader: 1 } as any),
      ).toThrowError('invalid entity translations loader');
    });

    it('throws with an empty object', () => {
      expect(() =>
        plugin.install(app, { entitySchemaLoader: () => Promise.resolve(null), entityTranslationsLoader: {} } as any),
      ).toThrowError('invalid entity translations loader');
    });
  });

  describe('enumSchemaLoader validation', () => {
    it('throws with a number', () => {
      expect(() =>
        plugin.install(app, { entitySchemaLoader: () => Promise.resolve(null), enumSchemaLoader: 1 } as any),
      ).toThrowError('invalid enum schema loader');
    });

    it('throws with an empty object', () => {
      expect(() =>
        plugin.install(app, { entitySchemaLoader: () => Promise.resolve(null), enumSchemaLoader: {} } as any),
      ).toThrowError('invalid enum schema loader');
    });
  });

  describe('enumTranslationsLoader validation', () => {
    it('throws with a number', () => {
      expect(() =>
        plugin.install(app, { entitySchemaLoader: () => Promise.resolve(null), enumTranslationsLoader: 1 } as any),
      ).toThrowError('invalid enum translations loader');
    });

    it('throws with an empty object', () => {
      expect(() =>
        plugin.install(app, { entitySchemaLoader: () => Promise.resolve(null), enumTranslationsLoader: {} } as any),
      ).toThrowError('invalid enum translations loader');
    });
  });

  describe('requestSchemaLoader validation', () => {
    it('throws with a number', () => {
      expect(() =>
        plugin.install(app, { entitySchemaLoader: () => Promise.resolve(null), requestSchemaLoader: 1 } as any),
      ).toThrowError('invalid request schema loader');
    });

    it('throws with an empty object', () => {
      expect(() =>
        plugin.install(app, { entitySchemaLoader: () => Promise.resolve(null), requestSchemaLoader: {} } as any),
      ).toThrowError('invalid request schema loader');
    });
  });

  describe('global config options', () => {
    it('applies renderHtml', () => {
      plugin.install(app, { entitySchemaLoader: () => Promise.resolve(null), renderHtml: true });
      expect(config.renderHtml).toBe(true);
    });

    it('applies component defaults', () => {
      plugin.install(app, {
        entitySchemaLoader: () => Promise.resolve(null),
        userTimezone: 'Europe/Paris',
        limit: 50,
        manual: true,
        allowReset: false,
      });
      expect(config.userTimezone).toBe('Europe/Paris');
      expect(config.limit).toBe(50);
      expect(config.manual).toBe(true);
      expect(config.allowReset).toBe(false);
    });
  });

  it('installs with minimal config', () => {
    plugin.install(app, { entitySchemaLoader: () => Promise.resolve(null) });

    expect(locale.value).toBe('en');
    expect(fallback.value).toBe('en');
    expect(requester).toBeUndefined();

    expect(icons.add).toBeUndefined();
    expect(icons.add_filter).toBeUndefined();
    expect(icons.add_value).toBeUndefined();
    expect(icons.delete).toBeUndefined();
    expect(icons.close).toBeUndefined();
    expect(icons.previous).toBeUndefined();
    expect(icons.next).toBeUndefined();
    expect(icons.collapse).toBeUndefined();
    expect(icons.sort).toBeUndefined();
    expect(icons.minus).toBeUndefined();
    expect(icons.reset).toBeUndefined();
    expect(icons.search).toBeUndefined();
    expect(icons.confirm).toBeUndefined();
    expect(icons.export).toBeUndefined();
    expect(icons.columns).toBeUndefined();
    expect(icons.loading).toBeUndefined();

    expect(classes.modal).toBe('qkit-modal');
    expect(classes.modal_header).toBe('qkit-modal-header');
    expect(classes.builder).toBe('qkit-builder');
    expect(classes.search).toBe('qkit-search');
    expect(classes.btn).toBe('qkit-btn');
    expect(classes.group).toBe('qkit-group');
    expect(classes.collection).toBe('qkit-collection');
    expect(classes.pagination).toBe('qkit-pagination');

    expect(getComponent({ type: 'string' })).toBe('text');
    expect(getComponent({ type: 'html' })).toBe('text');
    expect(getComponent({ type: 'integer' })).toBe('number');
    expect(getComponent({ type: 'float' })).toBe('number');
    expect(getComponent({ type: 'date' })).toBe('date');
    expect(getComponent({ type: 'datetime' })).toBe(DateTimeInput);
    expect(getComponent({ type: 'time' })).toBe('time');
    expect(getComponent({ type: 'boolean' })).toBe(BooleanInput);
    expect(getComponent({ type: 'string', enum: 'gender' })).toBe(SelectEnum);

    expect(config.renderHtml).toBe(false);
  });

  it('installs with full config', () => {
    const CustomInput = defineComponent({ template: '<input />' });
    const options = {
      icons: {
        add: 'icon_add',
        delete: 'icon_delete',
      },
      classes: {
        modal: 'my-modal',
        search: 'my-search',
      },
      typeInputs: {
        integer: 'my_integer',
        date: 'my_date',
      },
      propertyInputs: {
        user: { first_name: CustomInput },
      },
      defaultLocale: 'es',
      fallbackLocale: 'fr',
      requester: requesterConfig,
      entitySchemaLoader,
      entityTranslationsLoader,
      enumSchemaLoader,
      enumTranslationsLoader,
      renderHtml: true,
    };

    plugin.install(app, options as any);

    expect(locale.value).toBe('es');
    expect(fallback.value).toBe('fr');
    expect(requester).toBe(options.requester);

    expect(icons.add).toBe('icon_add');
    expect(icons.delete).toBe('icon_delete');
    expect(icons.columns).toBeUndefined();

    expect(classes.modal).toBe('my-modal');
    expect(classes.search).toBe('my-search');
    expect(classes.builder).toBe('qkit-builder');

    expect(getComponent({ type: 'integer' })).toBe('my_integer');
    expect(getComponent({ type: 'date' })).toBe('my_date');
    expect(getComponent({ type: 'string' })).toBe('text');
    expect(getComponent({ type: 'string', enum: 'gender' })).toBe(SelectEnum);
    expect(getComponent({ type: 'string' }, { owner: 'user', id: 'first_name' })).toBe(CustomInput);

    expect(config.renderHtml).toBe(true);
  });

  it('registers defaultIcons when icons is "default"', () => {
    plugin.install(app, { entitySchemaLoader: () => Promise.resolve(null), icons: 'default' });

    expect(icons.add).toEqual(defaultIcons.add);
    expect(icons.delete).toEqual(defaultIcons.delete);
    expect(icons.close).toEqual(defaultIcons.close);
    expect(icons.search).toEqual(defaultIcons.search);
    expect(icons.loading).toEqual(defaultIcons.loading);
  });

  it('wraps function-form loaders in {load: fn} objects', () => {
    const entityFn = () => Promise.resolve(null);
    const entityTransFn = () => Promise.resolve(null);
    const enumFn = () => Promise.resolve(null);
    const enumTransFn = () => Promise.resolve(null);
    const requestFn = () => Promise.resolve(null);

    // Should not throw - functions are wrapped in {load: fn} objects
    expect(() =>
      plugin.install(app, {
        entitySchemaLoader: entityFn,
        entityTranslationsLoader: entityTransFn,
        enumSchemaLoader: enumFn,
        enumTranslationsLoader: enumTransFn,
        requestSchemaLoader: requestFn,
      } as any),
    ).not.toThrow();
  });

  it('calls app.component 3 times for QkitSearch, QkitCollection, QkitBuilder', () => {
    plugin.install(app, { entitySchemaLoader: () => Promise.resolve(null) });

    expect(componentSpy).toHaveBeenCalledTimes(3);
    expect(componentSpy).toHaveBeenCalledWith('QkitSearch', expect.anything());
    expect(componentSpy).toHaveBeenCalledWith('QkitCollection', expect.anything());
    expect(componentSpy).toHaveBeenCalledWith('QkitBuilder', expect.anything());
  });

  it('registers operators when provided', () => {
    const operators = {
      condition: {
        basic: ['=' as const, '<>' as const],
      },
      group: ['and' as const],
    };

    expect(() =>
      plugin.install(app, {
        entitySchemaLoader: () => Promise.resolve(null),
        operators,
      }),
    ).not.toThrow();
  });

  it('registers computedScopes when provided', () => {
    const computedScopes = {
      user: [
        {
          id: 'active',
          computed: () => ({ active: true }),
        },
      ],
    };

    expect(() =>
      plugin.install(app, {
        entitySchemaLoader: () => Promise.resolve(null),
        computedScopes,
      }),
    ).not.toThrow();
  });

  it('registers cellTypeRenderers from options', () => {
    const CustomRenderer = defineComponent({ render() { return null; } });
    plugin.install(app, {
      entitySchemaLoader: () => Promise.resolve(null),
      cellTypeRenderers: { string: CustomRenderer },
    });
    // Verify the custom renderer was registered for the 'string' type
    expect(getTypeRenderer({ type: 'string' })).toBe(CustomRenderer);
  });

  it('registers cellPropertyRenderers from options', () => {
    const CustomRenderer = defineComponent({ render() { return null; } });
    plugin.install(app, {
      entitySchemaLoader: () => Promise.resolve(null),
      cellPropertyRenderers: {
        user: { first_name: CustomRenderer },
      },
    });
    // Verify the custom renderer was registered for user.first_name
    expect(getPropertyRenderer({ id: 'first_name', type: 'string', owner: 'user' })).toBe(CustomRenderer);
  });
});
