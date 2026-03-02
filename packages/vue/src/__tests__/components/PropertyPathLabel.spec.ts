import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import PropertyPathLabel from '@components/Collection/PropertyPathLabel.vue';
import { resolve, registerLoader, registerTranslationsLoader, loadRawTranslations } from '@core/EntitySchema';
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

describe('PropertyPathLabel', () => {
  it('displays the translated property name for a simple property', async () => {
    wrapper = mountWithPlugin(PropertyPathLabel, {
      props: { entitySchema: userSchema, propertyPath: 'first_name' },
    });
    await flushAll();
    expect(wrapper.text()).toBe('first name');
  });

  it('displays joined translations for a compound path', async () => {
    wrapper = mountWithPlugin(PropertyPathLabel, {
      props: { entitySchema: userSchema, propertyPath: 'company.brand_name' },
    });
    await flushAll();
    expect(wrapper.text()).toBe('the company brand name');
  });

  it('displays customLabel instead of the translation when provided', async () => {
    wrapper = mountWithPlugin(PropertyPathLabel, {
      props: { entitySchema: userSchema, propertyPath: 'first_name', customLabel: 'Custom' },
    });
    await flushAll();
    expect(wrapper.text()).toBe('Custom');
  });

  it('displays InvalidColumn for an invalid property path', async () => {
    wrapper = mountWithPlugin(PropertyPathLabel, {
      props: { entitySchema: userSchema, propertyPath: 'nonexistent' },
    });
    await flushAll();
    expect(wrapper.text()).toContain('invalid column');
    expect(wrapper.text()).toContain('nonexistent');
  });

  it('renders nothing while loading', () => {
    wrapper = mountWithPlugin(PropertyPathLabel, {
      props: { entitySchema: userSchema, propertyPath: 'first_name' },
    });
    expect(wrapper.text()).toBe('');
  });

  it('updates the translation when locale changes (schema translations)', async () => {
    // Pre-load fr translations so they are available immediately on locale switch
    await loadRawTranslations('user', 'fr');

    wrapper = mountWithPlugin(PropertyPathLabel, {
      props: { entitySchema: userSchema, propertyPath: 'first_name' },
    });
    await flushAll();
    expect(wrapper.text()).toBe('first name');

    locale.value = 'fr';
    await flushAll();
    expect(wrapper.text()).toBe('prénom');
  });

  it('updates compound path translation when locale changes', async () => {
    // Pre-load fr translations for both entities involved in the path
    await loadRawTranslations('user', 'fr');
    await loadRawTranslations('organization', 'fr');

    wrapper = mountWithPlugin(PropertyPathLabel, {
      props: { entitySchema: userSchema, propertyPath: 'company.brand_name' },
    });
    await flushAll();
    expect(wrapper.text()).toBe('the company brand name');

    locale.value = 'fr';
    await flushAll();
    expect(wrapper.text()).toBe('companie enseigne');
  });
});
