import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import ColumnEditor from '@components/Collection/ColumnEditor.vue';
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

async function openModal(w: VueWrapper) {
  const columnsButton = w.findAll('button').find((b) => b.attributes('aria-label')?.includes('columns'));
  await columnsButton!.trigger('click');
  await flushAll();
}

function getModalSelect(w: VueWrapper) {
  return w.find('dialog select');
}

function getSelectOptions(w: VueWrapper) {
  return getModalSelect(w).findAll('option').filter((o) => !o.attributes('disabled'));
}

function getColumnItems(w: VueWrapper) {
  return w.findAll('li');
}

describe('ColumnEditor', () => {
  it('opens modal on columns button click', async () => {
    wrapper = mountWithPlugin(ColumnEditor, {
      props: { entitySchema: userSchema, modelValue: ['first_name'], 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    await openModal(wrapper);
    expect(wrapper.find('dialog').exists()).toBe(true);
  });

  it('shows current columns as ColumnEditorItem elements', async () => {
    wrapper = mountWithPlugin(ColumnEditor, {
      props: { entitySchema: userSchema, modelValue: ['first_name', 'last_name'], 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    await openModal(wrapper);
    const items = getColumnItems(wrapper);
    expect(items.length).toBe(2);
  });

  it('shows available properties in the select (excludes already added and has_many)', async () => {
    wrapper = mountWithPlugin(ColumnEditor, {
      props: { entitySchema: userSchema, modelValue: ['first_name'], 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    await openModal(wrapper);
    const options = getSelectOptions(wrapper);
    const values = options.map((o) => o.attributes('value'));
    // first_name already added → not in options
    expect(values).not.toContain('first_name');
    // has_many relationships (favorite_fruits if array type) should be handled
    // belongs_to relationships should be included (company, friend)
    expect(values).toContain('company');
    expect(values).toContain('friend');
  });

  it('adds a column from the select', async () => {
    wrapper = mountWithPlugin(ColumnEditor, {
      props: { entitySchema: userSchema, modelValue: ['first_name'], 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    await openModal(wrapper);

    const select = getModalSelect(wrapper);
    await select.setValue('age');
    await flushAll();

    // Click add button
    const addButton = wrapper.find('dialog').findAll('button').find((b) => b.attributes('aria-label')?.includes('add'));
    await addButton!.trigger('click');
    await flushAll();

    expect(getColumnItems(wrapper).length).toBe(2);
  });

  it('removes a column', async () => {
    wrapper = mountWithPlugin(ColumnEditor, {
      props: { entitySchema: userSchema, modelValue: ['first_name', 'last_name'], 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    await openModal(wrapper);

    const deleteButton = wrapper.find('li').findAll('button').find((b) => b.attributes('aria-label')?.includes('delete'));
    await deleteButton!.trigger('click');
    await flushAll();

    expect(getColumnItems(wrapper).length).toBe(1);
  });

  it('updates v-model on confirm', async () => {
    const modelValue = ref(['first_name', 'last_name']);
    wrapper = mountWithPlugin(ColumnEditor, {
      props: { entitySchema: userSchema, modelValue: modelValue.value, 'onUpdate:modelValue': (v: string[]) => { modelValue.value = v; } },
    });
    await flushAll();
    await openModal(wrapper);

    // Remove first column
    const deleteButton = wrapper.find('li').findAll('button').find((b) => b.attributes('aria-label')?.includes('delete'));
    await deleteButton!.trigger('click');
    await flushAll();

    // Confirm
    const confirmButton = wrapper.find('dialog').findAll('button').find((b) => b.attributes('aria-label')?.includes('confirm'));
    await confirmButton!.trigger('click');
    await flushAll();

    expect(modelValue.value).toEqual(['last_name']);
  });

  it('does not update v-model on cancel', async () => {
    const modelValue = ref(['first_name', 'last_name']);
    wrapper = mountWithPlugin(ColumnEditor, {
      props: { entitySchema: userSchema, modelValue: modelValue.value, 'onUpdate:modelValue': (v: string[]) => { modelValue.value = v; } },
    });
    await flushAll();
    await openModal(wrapper);

    // Remove first column
    const deleteButton = wrapper.find('li').findAll('button').find((b) => b.attributes('aria-label')?.includes('delete'));
    await deleteButton!.trigger('click');
    await flushAll();

    // Close/cancel the modal
    const closeButton = wrapper.find('dialog').findAll('button').find((b) => b.attributes('aria-label')?.includes('close'));
    await closeButton!.trigger('click');
    await flushAll();

    expect(modelValue.value).toEqual(['first_name', 'last_name']);
  });

  it('shows custom open columns in options', async () => {
    wrapper = mountWithPlugin(ColumnEditor, {
      props: {
        entitySchema: userSchema,
        modelValue: ['first_name'],
        customColumns: { actions: { open: true, label: 'Actions' } },
        'onUpdate:modelValue': () => {},
      },
    });
    await flushAll();
    await openModal(wrapper);

    const options = getSelectOptions(wrapper);
    const values = options.map((o) => o.attributes('value'));
    expect(values).toContain('actions');
    const actionsOption = options.find((o) => o.attributes('value') === 'actions');
    expect(actionsOption!.text()).toBe('Actions');
  });

  it('disables confirm when all columns are removed', async () => {
    wrapper = mountWithPlugin(ColumnEditor, {
      props: { entitySchema: userSchema, modelValue: ['first_name'], 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    await openModal(wrapper);

    // Remove the only column
    const deleteButton = wrapper.find('li').findAll('button').find((b) => b.attributes('aria-label')?.includes('delete'));
    await deleteButton!.trigger('click');
    await flushAll();

    const confirmButton = wrapper.find('dialog').findAll('button').find((b) => b.attributes('aria-label')?.includes('confirm'));
    expect(confirmButton!.attributes('disabled')).toBeDefined();
  });

  it('updates modal header when locale changes (static translations)', async () => {
    loadedTranslations['fr'] = fr;

    wrapper = mountWithPlugin(ColumnEditor, {
      props: { entitySchema: userSchema, modelValue: ['first_name'], 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    await openModal(wrapper);

    expect(wrapper.find('h1').text()).toBe('columns');

    locale.value = 'fr';
    await flushAll();
    expect(wrapper.find('h1').text()).toBe('colonnes');
  });

  it('updates option labels when locale changes (schema translations)', async () => {
    await loadRawTranslations('user', 'fr');
    loadedTranslations['fr'] = fr;

    wrapper = mountWithPlugin(ColumnEditor, {
      props: { entitySchema: userSchema, modelValue: [], 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    await openModal(wrapper);

    const option = getSelectOptions(wrapper).find((o) => o.attributes('value') === 'first_name');
    expect(option!.text()).toBe('first name');

    locale.value = 'fr';
    await flushAll();

    const updatedOption = getSelectOptions(wrapper).find((o) => o.attributes('value') === 'first_name');
    expect(updatedOption!.text()).toBe('prénom');
  });

  it('shows custom open column with label function in options', async () => {
    wrapper = mountWithPlugin(ColumnEditor, {
      props: {
        entitySchema: userSchema,
        modelValue: ['first_name'],
        customColumns: { actions: { open: true, label: (loc: string) => `Actions-${loc}` } },
        'onUpdate:modelValue': () => {},
      },
    });
    await flushAll();
    await openModal(wrapper);

    const options = getSelectOptions(wrapper);
    const actionsOption = options.find((o) => o.attributes('value') === 'actions');
    expect(actionsOption).toBeTruthy();
    expect(actionsOption!.text()).toBe('Actions-en');
  });

  it('does not add column when no property is selected', async () => {
    wrapper = mountWithPlugin(ColumnEditor, {
      props: { entitySchema: userSchema, modelValue: ['first_name'], 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    await openModal(wrapper);

    // Click add button without selecting anything
    const addButton = wrapper.find('dialog').findAll('button').find((b) => b.attributes('aria-label')?.includes('add'));
    await addButton!.trigger('click');
    await flushAll();

    // Should still have 1 column
    expect(getColumnItems(wrapper).length).toBe(1);
  });

  it('excludes custom open columns already added from options', async () => {
    wrapper = mountWithPlugin(ColumnEditor, {
      props: {
        entitySchema: userSchema,
        modelValue: ['actions'],
        customColumns: { actions: { open: true, label: 'Actions' } },
        'onUpdate:modelValue': () => {},
      },
    });
    await flushAll();
    await openModal(wrapper);

    const options = getSelectOptions(wrapper);
    const values = options.map((o) => o.attributes('value'));
    expect(values).not.toContain('actions');
  });

  it('uses custom label function for existing column items in options', async () => {
    wrapper = mountWithPlugin(ColumnEditor, {
      props: {
        entitySchema: userSchema,
        modelValue: [],
        customColumns: { first_name: { label: (loc: string) => `Custom-${loc}` } },
        'onUpdate:modelValue': () => {},
      },
    });
    await flushAll();
    await openModal(wrapper);

    const options = getSelectOptions(wrapper);
    const firstNameOption = options.find((o) => o.attributes('value') === 'first_name');
    expect(firstNameOption).toBeTruthy();
    expect(firstNameOption!.text()).toBe('Custom-en');
  });

  describe('keyboard reorder feedback', () => {
    it('announces grab action via live message', async () => {
      wrapper = mountWithPlugin(ColumnEditor, {
        props: { entitySchema: userSchema, modelValue: ['first_name', 'last_name'], 'onUpdate:modelValue': () => {} },
      });
      await flushAll();
      await openModal(wrapper);

      // Find the grip button on the first item and trigger Enter (grab)
      const items = wrapper.findAll('li');
      const firstItem = items[0];
      // Trigger keydown Enter on the li element (which has the keyboard bindings from useDragAndDrop)
      await firstItem.trigger('keydown', { key: 'Enter' });
      await flushAll();

      const liveRegion = wrapper.find('[aria-live="assertive"]');
      expect(liveRegion.text()).toContain('grabbed');
    });

    it('announces cancel action via live message', async () => {
      wrapper = mountWithPlugin(ColumnEditor, {
        props: { entitySchema: userSchema, modelValue: ['first_name', 'last_name'], 'onUpdate:modelValue': () => {} },
      });
      await flushAll();
      await openModal(wrapper);

      const items = wrapper.findAll('li');
      const firstItem = items[0];
      // Grab
      await firstItem.trigger('keydown', { key: 'Enter' });
      await flushAll();
      // Cancel with Escape
      await firstItem.trigger('keydown', { key: 'Escape' });
      await flushAll();

      const liveRegion = wrapper.find('[aria-live="assertive"]');
      expect(liveRegion.text()).toContain('cancelled');
    });

    it('announces move action via live message', async () => {
      wrapper = mountWithPlugin(ColumnEditor, {
        props: { entitySchema: userSchema, modelValue: ['first_name', 'last_name'], 'onUpdate:modelValue': () => {} },
      });
      await flushAll();
      await openModal(wrapper);

      const items = wrapper.findAll('li');
      const firstItem = items[0];
      // Grab
      await firstItem.trigger('keydown', { key: 'Enter' });
      await flushAll();
      // Move down
      await firstItem.trigger('keydown', { key: 'ArrowDown' });
      await flushAll();

      const liveRegion = wrapper.find('[aria-live="assertive"]');
      expect(liveRegion.text()).toContain('moved');
    });

    it('announces drop action via live message', async () => {
      wrapper = mountWithPlugin(ColumnEditor, {
        props: { entitySchema: userSchema, modelValue: ['first_name', 'last_name'], 'onUpdate:modelValue': () => {} },
      });
      await flushAll();
      await openModal(wrapper);

      const items = wrapper.findAll('li');
      const firstItem = items[0];
      // Grab
      await firstItem.trigger('keydown', { key: 'Enter' });
      await flushAll();
      // Drop (Enter again)
      await firstItem.trigger('keydown', { key: 'Enter' });
      await flushAll();

      const liveRegion = wrapper.find('[aria-live="assertive"]');
      expect(liveRegion.text()).toContain('dropped');
    });

    it('uses custom label function for announcement', async () => {
      wrapper = mountWithPlugin(ColumnEditor, {
        props: {
          entitySchema: userSchema,
          modelValue: ['custom_col', 'first_name'],
          customColumns: { custom_col: { open: true, label: (loc: string) => `Custom-${loc}` } },
          'onUpdate:modelValue': () => {},
        },
      });
      await flushAll();
      await openModal(wrapper);

      const items = wrapper.findAll('li');
      const firstItem = items[0];
      // Grab
      await firstItem.trigger('keydown', { key: 'Enter' });
      await flushAll();

      const liveRegion = wrapper.find('[aria-live="assertive"]');
      // Should use the custom label function for the announcement
      expect(liveRegion.text()).toContain('Custom-en');
    });

    it('falls back to columnId when property path resolution fails', async () => {
      wrapper = mountWithPlugin(ColumnEditor, {
        props: {
          entitySchema: userSchema,
          modelValue: ['unknown_col', 'first_name'],
          customColumns: { unknown_col: { open: true, label: undefined as any } },
          'onUpdate:modelValue': () => {},
        },
      });
      await flushAll();
      await openModal(wrapper);

      const items = wrapper.findAll('li');
      const firstItem = items[0];
      // Grab triggers getColumnLabel with 'unknown_col' which will fail resolution
      await firstItem.trigger('keydown', { key: 'Enter' });
      await flushAll();

      const liveRegion = wrapper.find('[aria-live="assertive"]');
      // Should fall back to using the column ID itself
      expect(liveRegion.text()).toContain('unknown_col');
    });
  });
});
