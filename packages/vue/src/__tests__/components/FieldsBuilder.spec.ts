import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import FieldsBuilder from '@components/Collection/FieldsBuilder.vue';
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

function getSelect(w: VueWrapper) {
  return w.find('select');
}

function getSelectOptions(w: VueWrapper) {
  return getSelect(w).findAll('option').filter((o) => !o.attributes('disabled'));
}

function getFieldItems(w: VueWrapper) {
  return w.findAll('li');
}

describe('FieldsBuilder', () => {
  it('renders current fields as items', async () => {
    wrapper = mountWithPlugin(FieldsBuilder, {
      props: { entitySchema: userSchema, modelValue: ['first_name', 'last_name'], 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    expect(getFieldItems(wrapper).length).toBe(2);
  });

  it('shows available properties in the select (excludes already added)', async () => {
    wrapper = mountWithPlugin(FieldsBuilder, {
      props: { entitySchema: userSchema, modelValue: ['first_name'], 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    const values = getSelectOptions(wrapper).map((o) => o.attributes('value'));
    expect(values).not.toContain('first_name');
    expect(values).toContain('company');
    expect(values).toContain('friend');
  });

  it('updates v-model live when adding a field', async () => {
    const modelValue = ref(['first_name']);
    wrapper = mountWithPlugin(FieldsBuilder, {
      props: {
        entitySchema: userSchema,
        modelValue: modelValue.value,
        'onUpdate:modelValue': (v: string[]) => {
          modelValue.value = v;
        },
      },
    });
    await flushAll();

    await getSelect(wrapper).setValue('age');
    await flushAll();
    const addButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('add'));
    await addButton!.trigger('click');
    await flushAll();

    expect(modelValue.value).toEqual(['first_name', 'age']);
  });

  it('updates v-model live when removing a field', async () => {
    const modelValue = ref(['first_name', 'last_name']);
    wrapper = mountWithPlugin(FieldsBuilder, {
      props: {
        entitySchema: userSchema,
        modelValue: modelValue.value,
        'onUpdate:modelValue': (v: string[]) => {
          modelValue.value = v;
        },
      },
    });
    await flushAll();

    const deleteButton = wrapper.find('li').findAll('button').find((b) => b.attributes('aria-label')?.includes('delete'));
    await deleteButton!.trigger('click');
    await flushAll();

    expect(modelValue.value).toEqual(['last_name']);
  });

  it('does not add a field when no property is selected', async () => {
    const modelValue = ref(['first_name']);
    wrapper = mountWithPlugin(FieldsBuilder, {
      props: {
        entitySchema: userSchema,
        modelValue: modelValue.value,
        'onUpdate:modelValue': (v: string[]) => {
          modelValue.value = v;
        },
      },
    });
    await flushAll();

    const addButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('add'));
    await addButton!.trigger('click');
    await flushAll();

    expect(modelValue.value).toEqual(['first_name']);
    expect(getFieldItems(wrapper).length).toBe(1);
  });

  it('shows custom open fields in options', async () => {
    wrapper = mountWithPlugin(FieldsBuilder, {
      props: {
        entitySchema: userSchema,
        modelValue: ['first_name'],
        customFields: { actions: { open: true, label: 'Actions' } },
        'onUpdate:modelValue': () => {},
      },
    });
    await flushAll();
    const options = getSelectOptions(wrapper);
    const actionsOption = options.find((o) => o.attributes('value') === 'actions');
    expect(actionsOption).toBeTruthy();
    expect(actionsOption!.text()).toBe('Actions');
  });

  it('shows custom open field with label function in options', async () => {
    wrapper = mountWithPlugin(FieldsBuilder, {
      props: {
        entitySchema: userSchema,
        modelValue: ['first_name'],
        customFields: { actions: { open: true, label: (loc: string) => `Actions-${loc}` } },
        'onUpdate:modelValue': () => {},
      },
    });
    await flushAll();
    const options = getSelectOptions(wrapper);
    const actionsOption = options.find((o) => o.attributes('value') === 'actions');
    expect(actionsOption!.text()).toBe('Actions-en');
  });

  it('excludes custom open fields already added from options', async () => {
    wrapper = mountWithPlugin(FieldsBuilder, {
      props: {
        entitySchema: userSchema,
        modelValue: ['actions'],
        customFields: { actions: { open: true, label: 'Actions' } },
        'onUpdate:modelValue': () => {},
      },
    });
    await flushAll();
    const values = getSelectOptions(wrapper).map((o) => o.attributes('value'));
    expect(values).not.toContain('actions');
  });

  it('uses custom label function for property options', async () => {
    wrapper = mountWithPlugin(FieldsBuilder, {
      props: {
        entitySchema: userSchema,
        modelValue: [],
        customFields: { first_name: { label: (loc: string) => `Custom-${loc}` } },
        'onUpdate:modelValue': () => {},
      },
    });
    await flushAll();
    const firstNameOption = getSelectOptions(wrapper).find((o) => o.attributes('value') === 'first_name');
    expect(firstNameOption!.text()).toBe('Custom-en');
  });

  it('updates option labels when locale changes', async () => {
    await loadRawTranslations('user', 'fr');
    loadedTranslations['fr'] = fr;

    wrapper = mountWithPlugin(FieldsBuilder, {
      props: { entitySchema: userSchema, modelValue: [], 'onUpdate:modelValue': () => {} },
    });
    await flushAll();

    const option = getSelectOptions(wrapper).find((o) => o.attributes('value') === 'first_name');
    expect(option!.text()).toBe('first name');

    locale.value = 'fr';
    await flushAll();

    const updatedOption = getSelectOptions(wrapper).find((o) => o.attributes('value') === 'first_name');
    expect(updatedOption!.text()).toBe('prénom');
  });

  it('reflects external v-model changes', async () => {
    const modelValue = ref(['first_name']);
    wrapper = mountWithPlugin(FieldsBuilder, {
      props: {
        entitySchema: userSchema,
        modelValue: modelValue.value,
        'onUpdate:modelValue': (v: string[]) => {
          modelValue.value = v;
        },
      },
    });
    await flushAll();
    expect(getFieldItems(wrapper).length).toBe(1);

    await wrapper.setProps({ modelValue: ['first_name', 'last_name', 'age'] });
    await flushAll();
    expect(getFieldItems(wrapper).length).toBe(3);
  });

  describe('keyboard reorder feedback', () => {
    it('announces grab action via live message', async () => {
      wrapper = mountWithPlugin(FieldsBuilder, {
        props: { entitySchema: userSchema, modelValue: ['first_name', 'last_name'], 'onUpdate:modelValue': () => {} },
      });
      await flushAll();

      const firstItem = wrapper.findAll('li')[0];
      await firstItem.trigger('keydown', { key: 'Enter' });
      await flushAll();

      expect(wrapper.find('[aria-live="assertive"]').text()).toContain('grabbed');
    });

    it('announces cancel action via live message', async () => {
      wrapper = mountWithPlugin(FieldsBuilder, {
        props: { entitySchema: userSchema, modelValue: ['first_name', 'last_name'], 'onUpdate:modelValue': () => {} },
      });
      await flushAll();

      const firstItem = wrapper.findAll('li')[0];
      await firstItem.trigger('keydown', { key: 'Enter' });
      await flushAll();
      await firstItem.trigger('keydown', { key: 'Escape' });
      await flushAll();

      expect(wrapper.find('[aria-live="assertive"]').text()).toContain('cancelled');
    });

    it('announces move action via live message', async () => {
      wrapper = mountWithPlugin(FieldsBuilder, {
        props: { entitySchema: userSchema, modelValue: ['first_name', 'last_name'], 'onUpdate:modelValue': () => {} },
      });
      await flushAll();

      const firstItem = wrapper.findAll('li')[0];
      await firstItem.trigger('keydown', { key: 'Enter' });
      await flushAll();
      await firstItem.trigger('keydown', { key: 'ArrowDown' });
      await flushAll();

      expect(wrapper.find('[aria-live="assertive"]').text()).toContain('moved');
    });

    it('announces drop action via live message', async () => {
      wrapper = mountWithPlugin(FieldsBuilder, {
        props: { entitySchema: userSchema, modelValue: ['first_name', 'last_name'], 'onUpdate:modelValue': () => {} },
      });
      await flushAll();

      const firstItem = wrapper.findAll('li')[0];
      await firstItem.trigger('keydown', { key: 'Enter' });
      await flushAll();
      await firstItem.trigger('keydown', { key: 'Enter' });
      await flushAll();

      expect(wrapper.find('[aria-live="assertive"]').text()).toContain('dropped');
    });
  });
});
