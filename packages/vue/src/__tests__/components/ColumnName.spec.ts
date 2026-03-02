import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ColumnName from '@components/Collection/ColumnName.vue';
import { resolve, registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { locale } from '@i18n/i18n';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { flushAll } from '@tests/helpers/flushAsync';
import type { EntitySchema } from '@core/EntitySchema';
import type { VueWrapper } from '@vue/test-utils';

let userSchema: EntitySchema;
let wrapper: VueWrapper;

beforeEach(async () => {
  registerLoader(entitySchemaLoader);
  registerTranslationsLoader(entityTranslationsLoader);
  userSchema = await resolve('user');
});

afterEach(() => {
  wrapper?.unmount();
});

describe('ColumnName', () => {
  it('delegates to PropertyPathLabel when not open', async () => {
    wrapper = mountWithPlugin(ColumnName, {
      props: { entitySchema: userSchema, columnId: 'first_name' },
    });
    await flushAll();
    expect(wrapper.text()).toBe('first name');
  });

  it('displays label string when open', async () => {
    wrapper = mountWithPlugin(ColumnName, {
      props: { entitySchema: userSchema, columnId: 'custom', open: true, label: 'My Column' },
    });
    await flushAll();
    expect(wrapper.text()).toBe('My Column');
  });

  it('calls label function with locale when open', async () => {
    const labelFn = (loc: string) => (loc === 'en' ? 'English Label' : 'French Label');
    wrapper = mountWithPlugin(ColumnName, {
      props: { entitySchema: userSchema, columnId: 'custom', open: true, label: labelFn },
    });
    await flushAll();
    expect(wrapper.text()).toBe('English Label');
  });

  it('renders nothing when open without a label', async () => {
    wrapper = mountWithPlugin(ColumnName, {
      props: { entitySchema: userSchema, columnId: 'custom', open: true },
    });
    await flushAll();
    expect(wrapper.text()).toBe('');
  });

  it('passes customLabel to PropertyPathLabel when not open', async () => {
    wrapper = mountWithPlugin(ColumnName, {
      props: { entitySchema: userSchema, columnId: 'first_name', label: 'Custom' },
    });
    await flushAll();
    expect(wrapper.text()).toBe('Custom');
  });

  it('re-calls label function when locale changes', async () => {
    const labelFn = (loc: string) => (loc === 'en' ? 'English Label' : 'French Label');
    wrapper = mountWithPlugin(ColumnName, {
      props: { entitySchema: userSchema, columnId: 'custom', open: true, label: labelFn },
    });
    await flushAll();
    expect(wrapper.text()).toBe('English Label');

    locale.value = 'fr';
    await flushAll();
    expect(wrapper.text()).toBe('French Label');
  });
});
