import { describe, it, expect } from 'vitest';

import plugin from '../../core/Plugin';
import { requester } from '../../core/Requester';
import { icons } from '../../core/IconManager';
import { classes } from '../../core/ClassManager';
import { getComponent } from '../../core/InputManager';
import { config } from '../../config/config';
import { locale, fallback } from '../../i18n/i18n';
import { schemaLoader, schemaLocaleLoader } from '../assets/SchemaLoader';
import requesterConfig from '../assets/Requester';
import { resolve } from '../../core/Schema';

describe('plugin', () => {
  it('full config', async () => {
    expect(plugin).toBeDefined();
    const options = {
      icons: {
        add: 'icon_add',
        delete: 'icon_delete',
      },
      classes: {
        modal: 'my-modal',
        search: 'my-search',
      },
      inputs: {
        integer: 'my_integer',
        date: 'my_date',
      },
      defaultLocale: 'es',
      fallbackLocale: 'fr',
      requester: requesterConfig,
      schemaLoader,
      schemaLocaleLoader,
      renderHtml: true,
    };
    plugin.install(null, options);
    expect(locale.value).toBe('es');
    expect(fallback.value).toBe('fr');
    expect(requester).toBe(options.requester);

    expect(config).toEqual({
      renderHtml: true,
    });
    expect(icons.add).toEqual('icon_add');
    expect(icons.add_filter).toBeUndefined();
    expect(icons.delete).toEqual('icon_delete');

    expect(classes.modal).toEqual('my-modal');
    expect(classes.search).toEqual('my-search');
    expect(classes.builder).toEqual('qkit-builder');

    expect(getComponent('integer')).toBe('my_integer');
    expect(getComponent('date')).toBe('my_date');
    expect(getComponent('string')).toBe('text');
    expect(getComponent('string', true)).toEqual('select');

    const schema = await resolve('user');
    expect(schema).toBeDefined();
    expect(schema.name).toBe('user');
  });
});
