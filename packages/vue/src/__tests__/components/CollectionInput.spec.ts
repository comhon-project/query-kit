import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';
import CollectionInput from '@components/Filter/CollectionInput.vue';
import UniqueInput from '@components/Filter/UniqueInput.vue';
import { resolve, registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { builderConfigProvide } from '@tests/helpers/provideConfig';
import { flushAll } from '@tests/helpers/flushAsync';
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

function mountCollection(overrides: Record<string, any> = {}) {
  const property = schema.getProperty('first_name');
  wrapper = mountWithPlugin(CollectionInput, {
    props: {
      target: property,
      entitySchema: schema,
      modelValue: [],
      ...overrides,
    },
    global: { provide: builderConfigProvide() },
  });
}

describe('CollectionInput', () => {
  it('initializes empty array with one undefined element', async () => {
    mountCollection();
    await flushAll();
    // watchEffect sets [undefined] when empty array is provided
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([undefined]);
  });

  it('renders one UniqueInput per value', async () => {
    mountCollection({ modelValue: ['a', 'b'] });
    await flushAll();
    const inputs = wrapper.findAllComponents(UniqueInput);
    expect(inputs).toHaveLength(2);
  });

  it('adds a new entry on add button click', async () => {
    mountCollection({ modelValue: ['a'] });
    await flushAll();
    const inputsBefore = wrapper.findAllComponents(UniqueInput);
    expect(inputsBefore).toHaveLength(1);
    // Find the add button (last button, outside <li> elements)
    const buttons = wrapper.findAll('button');
    const addBtn = buttons[buttons.length - 1];
    await addBtn.trigger('click');
    await nextTick();
    // After in-place push, the reactive array grows and renders a second UniqueInput
    const inputsAfter = wrapper.findAllComponents(UniqueInput);
    expect(inputsAfter).toHaveLength(2);
  });

  it('removes entry at index on delete button click', async () => {
    mountCollection({ modelValue: ['a', 'b', 'c'] });
    await flushAll();
    expect(wrapper.findAllComponents(UniqueInput)).toHaveLength(3);
    // Find delete buttons within list items (not the add button)
    const listItems = wrapper.findAll('li');
    const deleteBtn = listItems[1].find('button');
    await deleteBtn!.trigger('click');
    await nextTick();
    expect(wrapper.findAllComponents(UniqueInput)).toHaveLength(2);
  });

  it('hides add and delete buttons when editable is false', async () => {
    mountCollection({ modelValue: ['a'], editable: false });
    await flushAll();
    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(0);
  });

  it('maintains at least one element after removing last', async () => {
    mountCollection({ modelValue: ['a'] });
    await flushAll();
    expect(wrapper.findAllComponents(UniqueInput)).toHaveLength(1);
    const listItems = wrapper.findAll('li');
    const deleteBtn = listItems[0].find('button');
    await deleteBtn!.trigger('click');
    await nextTick();
    // After removing the only element, watchEffect should restore [undefined]
    await flushAll();
    expect(wrapper.findAllComponents(UniqueInput)).toHaveLength(1);
  });
});
