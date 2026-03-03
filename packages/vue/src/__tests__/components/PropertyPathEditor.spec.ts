import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import PropertyPathEditor from '@components/Collection/PropertyPathEditor.vue';
import { resolve, registerLoader, registerTranslationsLoader, loadRawTranslations } from '@core/EntitySchema';
import { locale, loadedTranslations } from '@i18n/i18n';
import fr from '@i18n/locales/fr';
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

describe('PropertyPathEditor', () => {
  it('displays ColumnName for the current path', async () => {
    wrapper = mountWithPlugin(PropertyPathEditor, {
      props: { entitySchema: userSchema, columns: ['first_name'], modelValue: 'first_name', 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    expect(wrapper.text()).toContain('first name');
  });

  it('shows expand button for a belongs_to relationship', async () => {
    wrapper = mountWithPlugin(PropertyPathEditor, {
      props: { entitySchema: userSchema, columns: ['company'], modelValue: 'company', 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    // company is belongs_to → expandable → should show add button
    const addButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('add'));
    expect(addButton).toBeTruthy();
  });

  it('does not show expand button for a non-relationship property', async () => {
    wrapper = mountWithPlugin(PropertyPathEditor, {
      props: { entitySchema: userSchema, columns: ['first_name'], modelValue: 'first_name', 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    const addButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('add'));
    expect(addButton).toBeUndefined();
  });

  it('shows select with related properties on expand click', async () => {
    wrapper = mountWithPlugin(PropertyPathEditor, {
      props: { entitySchema: userSchema, columns: ['company'], modelValue: 'company', 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    const addButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('add'));
    await addButton!.trigger('click');
    await flushAll();

    const select = wrapper.find('select');
    expect(select.exists()).toBe(true);
    const options = select.findAll('option').filter((o) => !o.attributes('disabled'));
    // organization properties: id, brand_name, address, description, contacts (has_many)
    // Only non-relationship + one-to-one: id, brand_name, address, description
    expect(options.length).toBeGreaterThanOrEqual(4);
  });

  it('updates propertyPath when selecting a property from the dropdown', async () => {
    const modelValue = ref('company');
    wrapper = mountWithPlugin(PropertyPathEditor, {
      props: { entitySchema: userSchema, columns: [], modelValue: modelValue.value, 'onUpdate:modelValue': (v: string) => { modelValue.value = v; } },
    });
    await flushAll();

    // Click expand
    const addButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('add'));
    await addButton!.trigger('click');
    await flushAll();

    // Select brand_name
    const select = wrapper.find('select');
    await select.setValue('brand_name');
    await flushAll();

    expect(modelValue.value).toBe('company.brand_name');
  });

  it('shows reduce button when path has more than 1 segment', async () => {
    wrapper = mountWithPlugin(PropertyPathEditor, {
      props: { entitySchema: userSchema, columns: [], modelValue: 'company.brand_name', 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    const removeButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('remove'));
    expect(removeButton).toBeTruthy();
  });

  it('truncates path on reduce click', async () => {
    const modelValue = ref('company.brand_name');
    wrapper = mountWithPlugin(PropertyPathEditor, {
      props: { entitySchema: userSchema, columns: [], modelValue: modelValue.value, 'onUpdate:modelValue': (v: string) => { modelValue.value = v; } },
    });
    await flushAll();

    const removeButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('remove'));
    await removeButton!.trigger('click');
    await flushAll();

    expect(modelValue.value).toBe('company');
  });

  it('excludes already-used columns from the select options', async () => {
    wrapper = mountWithPlugin(PropertyPathEditor, {
      props: { entitySchema: userSchema, columns: ['company.brand_name'], modelValue: 'company', 'onUpdate:modelValue': () => {} },
    });
    await flushAll();

    const addButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('add'));
    await addButton!.trigger('click');
    await flushAll();

    const options = wrapper.find('select').findAll('option').filter((o) => !o.attributes('disabled'));
    const values = options.map((o) => o.attributes('value'));
    expect(values).not.toContain('brand_name');
  });

  it('does not show expand for has_many relationship', async () => {
    // Resolve organization schema for the contacts property (has_many)
    await resolve('organization');
    const orgSchema = await resolve('organization');
    wrapper = mountWithPlugin(PropertyPathEditor, {
      props: { entitySchema: orgSchema, columns: ['contacts'], modelValue: 'contacts', 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    const addButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('add'));
    expect(addButton).toBeUndefined();
  });

  it('updates select option labels when locale changes (schema translations)', async () => {
    await loadRawTranslations('user', 'fr');
    await loadRawTranslations('organization', 'fr');
    loadedTranslations['fr'] = fr;

    wrapper = mountWithPlugin(PropertyPathEditor, {
      props: { entitySchema: userSchema, columns: [], modelValue: 'company', 'onUpdate:modelValue': () => {} },
    });
    await flushAll();

    // Expand to show options
    const addButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('add'));
    await addButton!.trigger('click');
    await flushAll();

    const options = wrapper.find('select').findAll('option').filter((o) => !o.attributes('disabled'));
    const brandNameOption = options.find((o) => o.attributes('value') === 'brand_name');
    expect(brandNameOption!.text()).toBe('brand name');

    locale.value = 'fr';
    await flushAll();
    const updatedOptions = wrapper.find('select').findAll('option').filter((o) => !o.attributes('disabled'));
    const updatedBrandNameOption = updatedOptions.find((o) => o.attributes('value') === 'brand_name');
    expect(updatedBrandNameOption!.text()).toBe('enseigne');
  });

  it('handles invalid property path gracefully', async () => {
    wrapper = mountWithPlugin(PropertyPathEditor, {
      props: { entitySchema: userSchema, columns: [], modelValue: 'nonexistent_prop', 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    // Should not throw, and should not show expand button
    const addButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('add'));
    expect(addButton).toBeUndefined();
  });

  it('collapses editing mode when reduce clicked while editing', async () => {
    wrapper = mountWithPlugin(PropertyPathEditor, {
      props: { entitySchema: userSchema, columns: [], modelValue: 'company', 'onUpdate:modelValue': () => {} },
    });
    await flushAll();

    // Expand
    const addButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('add'));
    await addButton!.trigger('click');
    await flushAll();
    expect(wrapper.find('select').exists()).toBe(true);

    // Click reduce while editing → should collapse editing, not truncate path
    const removeButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('remove'));
    await removeButton!.trigger('click');
    await flushAll();
    expect(wrapper.find('select').exists()).toBe(false);
  });
});
