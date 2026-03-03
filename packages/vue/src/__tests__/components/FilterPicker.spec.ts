import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { nextTick, reactive } from 'vue';
import FilterPicker from '@components/Filter/FilterPicker.vue';
import {
  resolve,
  registerLoader,
  registerTranslationsLoader,
  loadRawTranslations,
} from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { builderConfigProvide } from '@tests/helpers/provideConfig';
import { flushAll } from '@tests/helpers/flushAsync';
import { locale } from '@i18n/i18n';
import type { VueWrapper } from '@vue/test-utils';
import type { EntitySchema } from '@core/EntitySchema';

let wrapper: VueWrapper;
let schema: EntitySchema;

beforeEach(async () => {
  registerLoader(entitySchemaLoader);
  registerTranslationsLoader(entityTranslationsLoader);
  registerRequestLoader(requestSchemaLoader);
  schema = await resolve('user');
});

afterEach(() => {
  wrapper?.unmount();
});

function mountFilterPicker(
  configOverrides: Record<string, unknown> = {},
  show = true,
) {
  const showRef = reactive({ value: show });
  wrapper = mountWithPlugin(FilterPicker, {
    props: {
      entitySchema: schema,
      show: showRef.value,
      'onUpdate:show': (v: boolean) => {
        showRef.value = v;
        wrapper.setProps({ show: v });
      },
    },
    global: { provide: builderConfigProvide(configOverrides) },
  });
}

describe('FilterPicker', () => {
  it('renders radio buttons for condition and group', async () => {
    mountFilterPicker();
    await flushAll();

    const radios = wrapper.findAll('input[type="radio"]');
    expect(radios.length).toBe(2);
  });

  it('lists searchable properties and scopes in select dropdown', async () => {
    mountFilterPicker();
    await flushAll();

    const options = wrapper.findAll('select option');
    // user filtrable properties: first_name, last_name, age, gender, married, birth_date, company, favorite_fruits
    // user filtrable scopes: scope, string_scope, datetime_scope, enum_scope
    // total = 8 properties + 4 scopes = 12
    expect(options.length).toBe(12);
  });

  it('defaults to condition radio selected', async () => {
    mountFilterPicker();
    await flushAll();

    const radios = wrapper.findAll('input[type="radio"]');
    const conditionRadio = radios[0];
    expect(conditionRadio.attributes('checked')).toBeDefined();
  });

  it('emits validate with condition filter when string property selected and form submitted', async () => {
    mountFilterPicker();
    await flushAll();

    const select = wrapper.find('select');
    await select.setValue('first_name');
    await wrapper.find('form').trigger('submit');
    await flushAll();
    await nextTick();
    await flushAll();

    expect(wrapper.emitted('validate')).toEqual([
      [expect.objectContaining({ type: 'condition', property: 'first_name', operator: '=' })],
    ]);
  });

  it('emits validate with scope filter when scope selected and submitted', async () => {
    mountFilterPicker();
    await flushAll();

    const select = wrapper.find('select');
    await select.setValue('scope');
    await wrapper.find('form').trigger('submit');
    await flushAll();
    await nextTick();
    await flushAll();

    expect(wrapper.emitted('validate')).toEqual([
      [expect.objectContaining({ type: 'scope', id: 'scope', parameters: [] })],
    ]);
  });

  it('emits validate with relationship_condition for relationship property', async () => {
    mountFilterPicker();
    await flushAll();

    const select = wrapper.find('select');
    await select.setValue('company');
    await wrapper.find('form').trigger('submit');
    await flushAll();
    await nextTick();
    await flushAll();

    expect(wrapper.emitted('validate')).toEqual([
      [expect.objectContaining({ type: 'relationship_condition', property: 'company', operator: 'has' })],
    ]);
  });

  it('emits validate with group filter when group radio selected and submitted', async () => {
    mountFilterPicker();
    await flushAll();

    // Click the group radio button
    const radios = wrapper.findAll('input[type="radio"]');
    await radios[1].trigger('click');
    await nextTick();

    await wrapper.find('form').trigger('submit');
    await flushAll();
    await nextTick();
    await flushAll();

    expect(wrapper.emitted('validate')).toEqual([
      [expect.objectContaining({ type: 'group', operator: 'and', filters: [] })],
    ]);
  });

  it('hides group radio when no group operators', async () => {
    mountFilterPicker({ allowedOperators: { group: [] } });
    await flushAll();

    const radios = wrapper.findAll('input[type="radio"]');
    expect(radios.length).toBe(1);
  });

  it('disables select when group radio is selected', async () => {
    mountFilterPicker();
    await flushAll();

    const radios = wrapper.findAll('input[type="radio"]');
    await radios[1].trigger('click');
    await nextTick();

    const select = wrapper.find('select');
    expect(select.attributes('disabled')).toBeDefined();
  });

  it('select option labels update when locale changes', async () => {
    await loadRawTranslations('user', 'fr');

    mountFilterPicker();
    await flushAll();

    // Check that first_name is labelled in English
    const options = wrapper.findAll('select option');
    const firstNameOption = options.find((o) => o.attributes('value') === 'first_name');
    expect(firstNameOption?.text()).toBe('first name');

    locale.value = 'fr';
    await flushAll();

    const updatedOptions = wrapper.findAll('select option');
    const updatedFirstNameOption = updatedOptions.find((o) => o.attributes('value') === 'first_name');
    expect(updatedFirstNameOption?.text()).toBe('prénom');
  });
});
