import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Header from '@components/Collection/Header.vue';
import { resolve, registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { locale, loadedTranslations } from '@i18n/i18n';
import fr from '@i18n/locales/fr';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { flushAll } from '@tests/helpers/flushAsync';
import type { EntitySchema } from '@core/EntitySchema';
import type { VueWrapper } from '@vue/test-utils';

let userSchema: EntitySchema;
let wrapper: VueWrapper;

beforeEach(async () => {
  registerLoader(entitySchemaLoader);
  registerTranslationsLoader(entityTranslationsLoader);
  registerRequestLoader(requestSchemaLoader);
  userSchema = await resolve('user');
});

afterEach(() => {
  wrapper?.unmount();
});

describe('Header', () => {
  it('renders a button for a sortable column', async () => {
    wrapper = mountWithPlugin(Header, {
      props: { entitySchema: userSchema, columnId: 'first_name' },
    });
    await flushAll();
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('renders a div without button for a non-sortable column', async () => {
    wrapper = mountWithPlugin(Header, {
      props: { entitySchema: userSchema, columnId: 'gender' },
    });
    await flushAll();
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.find('div').exists()).toBe(true);
  });

  it('is sortable when hasCustomOrder is true even if property is not sortable', async () => {
    wrapper = mountWithPlugin(Header, {
      props: { entitySchema: userSchema, columnId: 'gender', hasCustomOrder: true },
    });
    await flushAll();
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('is not sortable when open is true', async () => {
    wrapper = mountWithPlugin(Header, {
      props: { entitySchema: userSchema, columnId: 'first_name', open: true },
    });
    await flushAll();
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('sets aria-sort="ascending" when order is asc', async () => {
    wrapper = mountWithPlugin(Header, {
      props: { entitySchema: userSchema, columnId: 'first_name', order: 'asc' },
    });
    await flushAll();
    expect(wrapper.find('th').attributes('aria-sort')).toBe('ascending');
    expect(wrapper.find('button').attributes('asc')).toBeDefined();
  });

  it('sets aria-sort="descending" when order is desc', async () => {
    wrapper = mountWithPlugin(Header, {
      props: { entitySchema: userSchema, columnId: 'first_name', order: 'desc' },
    });
    await flushAll();
    expect(wrapper.find('th').attributes('aria-sort')).toBe('descending');
    expect(wrapper.find('button').attributes('desc')).toBeDefined();
  });

  it('sets aria-sort="none" when no order on a sortable column', async () => {
    wrapper = mountWithPlugin(Header, {
      props: { entitySchema: userSchema, columnId: 'first_name' },
    });
    await flushAll();
    expect(wrapper.find('th').attributes('aria-sort')).toBe('none');
  });

  it('has no aria-sort when column is not sortable', async () => {
    wrapper = mountWithPlugin(Header, {
      props: { entitySchema: userSchema, columnId: 'gender' },
    });
    await flushAll();
    expect(wrapper.find('th').attributes('aria-sort')).toBeUndefined();
  });

  it('emits click with columnId and ctrlKey=false on click', async () => {
    wrapper = mountWithPlugin(Header, {
      props: { entitySchema: userSchema, columnId: 'first_name' },
    });
    await flushAll();
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(wrapper.emitted('click')![0]).toEqual(['first_name', false]);
  });

  it('emits click with ctrlKey=true on Ctrl+click', async () => {
    wrapper = mountWithPlugin(Header, {
      props: { entitySchema: userSchema, columnId: 'first_name' },
    });
    await flushAll();
    await wrapper.find('button').trigger('click', { ctrlKey: true });
    expect(wrapper.emitted('click')![0]).toEqual(['first_name', true]);
  });

  it('renders ColumnName with correct props', async () => {
    wrapper = mountWithPlugin(Header, {
      props: { entitySchema: userSchema, columnId: 'first_name' },
    });
    await flushAll();
    expect(wrapper.text()).toContain('first name');
  });

  it('updates orderLabel when locale changes (static translations)', async () => {
    // Pre-load fr translations so they are available immediately on locale switch
    loadedTranslations['fr'] = fr;

    wrapper = mountWithPlugin(Header, {
      props: { entitySchema: userSchema, columnId: 'first_name', order: 'asc' },
    });
    await flushAll();
    expect(wrapper.text()).toContain('(asc.)');

    locale.value = 'fr';
    await flushAll();
    expect(wrapper.text()).toContain('(crois.)');
  });
});
