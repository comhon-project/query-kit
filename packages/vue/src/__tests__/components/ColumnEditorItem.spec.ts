import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';
import ColumnEditorItem from '@components/Collection/ColumnEditorItem.vue';
import PropertyPathEditor from '@components/Collection/PropertyPathEditor.vue';
import { resolve, registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
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

describe('ColumnEditorItem', () => {
  it('renders grip and delete buttons', async () => {
    wrapper = mountWithPlugin(ColumnEditorItem, {
      props: { entitySchema: userSchema, columns: [], modelValue: 'first_name', 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('emits remove on delete button click', async () => {
    wrapper = mountWithPlugin(ColumnEditorItem, {
      props: { entitySchema: userSchema, columns: [], modelValue: 'first_name', 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    const deleteButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('delete'));
    await deleteButton!.trigger('click');
    expect(wrapper.emitted('remove')).toHaveLength(1);
  });

  it('emits grip-start on grip mousedown', async () => {
    wrapper = mountWithPlugin(ColumnEditorItem, {
      props: { entitySchema: userSchema, columns: [], modelValue: 'first_name', 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    const gripButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('reorder'));
    await gripButton!.trigger('mousedown');
    expect(wrapper.emitted('grip-start')).toHaveLength(1);
  });

  it('shows PropertyPathEditor when not open', async () => {
    wrapper = mountWithPlugin(ColumnEditorItem, {
      props: { entitySchema: userSchema, columns: [], modelValue: 'first_name', 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    // PropertyPathLabel inside PropertyPathEditor shows the translated name
    expect(wrapper.text()).toContain('first name');
  });

  it('shows label string when open', async () => {
    wrapper = mountWithPlugin(ColumnEditorItem, {
      props: { entitySchema: userSchema, columns: [], modelValue: 'custom', open: true, label: 'My Column', 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    expect(wrapper.find('span').text()).toBe('My Column');
  });

  it('calls label function with locale when open', async () => {
    const labelFn = (loc: string) => `Label-${loc}`;
    wrapper = mountWithPlugin(ColumnEditorItem, {
      props: { entitySchema: userSchema, columns: [], modelValue: 'custom', open: true, label: labelFn, 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    expect(wrapper.find('span').text()).toBe('Label-en');
  });

  it('shows columnId when open without label', async () => {
    wrapper = mountWithPlugin(ColumnEditorItem, {
      props: { entitySchema: userSchema, columns: [], modelValue: 'custom_col', open: true, 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    expect(wrapper.find('span').text()).toBe('custom_col');
  });

  it('emits grip-start on grip keydown', async () => {
    wrapper = mountWithPlugin(ColumnEditorItem, {
      props: { entitySchema: userSchema, columns: [], modelValue: 'first_name', 'onUpdate:modelValue': () => {} },
    });
    await flushAll();
    const gripButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('reorder'));
    await gripButton!.trigger('keydown');
    expect(wrapper.emitted('grip-start')).toHaveLength(1);
  });

  it('propagates modelValue changes from PropertyPathEditor when not open', async () => {
    let currentValue = 'first_name';
    wrapper = mountWithPlugin(ColumnEditorItem, {
      props: {
        entitySchema: userSchema,
        columns: [],
        modelValue: currentValue,
        'onUpdate:modelValue': (v: string) => {
          currentValue = v;
          wrapper.setProps({ modelValue: v });
        },
      },
    });
    await flushAll();

    // PropertyPathEditor should exist when open is not set (defaults to false/undefined)
    const editor = wrapper.findComponent(PropertyPathEditor);
    expect(editor.exists()).toBe(true);

    // Emit a modelValue update from PropertyPathEditor to exercise v-model on line 40
    editor.vm.$emit('update:modelValue', 'last_name');
    await nextTick();

    expect(currentValue).toBe('last_name');
  });

  it('does not render PropertyPathEditor when open is true', async () => {
    wrapper = mountWithPlugin(ColumnEditorItem, {
      props: { entitySchema: userSchema, columns: [], modelValue: 'first_name', open: true, label: 'Test', 'onUpdate:modelValue': () => {} },
    });
    await flushAll();

    // When open, span is shown instead of PropertyPathEditor
    expect(wrapper.find('span').exists()).toBe(true);
    expect(wrapper.findComponent(PropertyPathEditor).exists()).toBe(false);
  });
});
