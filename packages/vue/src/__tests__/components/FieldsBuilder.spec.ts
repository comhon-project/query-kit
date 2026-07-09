import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import FieldsBuilder from '@components/Collection/FieldsBuilder.vue';
import FieldsList from '@components/Collection/FieldsList.vue';
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

function mountBuilder(props: Record<string, unknown> = {}) {
  wrapper = mountWithPlugin(FieldsBuilder, {
    props: {
      entitySchema: userSchema,
      modelValue: ['first_name', 'last_name'],
      'onUpdate:modelValue': () => {},
      ...props,
    },
  });
}

describe('FieldsBuilder', () => {
  it('wraps the FieldsList in a section.qkit-fields-builder labelled "fields builder"', async () => {
    mountBuilder();
    await flushAll();
    const section = wrapper.find('section.qkit-fields-builder');
    expect(section.exists()).toBe(true);
    const label = section.find('.qkit-builder-label');
    expect(label.text()).toBe('columns');
    expect(section.attributes('aria-labelledby')).toBe(label.attributes('id'));
    expect(wrapper.findComponent(FieldsList).exists()).toBe(true);
  });

  it('forwards model, entitySchema and customFields to the FieldsList', async () => {
    const customFields = { first_name: { label: 'First' } };
    mountBuilder({ modelValue: ['first_name', 'age'], customFields });
    await flushAll();
    const list = wrapper.findComponent(FieldsList);
    expect(list.props('modelValue')).toEqual(['first_name', 'age']);
    expect((list.props('entitySchema') as EntitySchema).id).toBe('user');
    expect(list.props('customFields')).toEqual(customFields);
  });

  it('propagates a FieldsList model update to its own model', async () => {
    mountBuilder();
    await flushAll();
    wrapper.findComponent(FieldsList).vm.$emit('update:modelValue', ['age']);
    await flushAll();
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual(['age']);
  });

  it('renders the #actions slot in a toolbar inside the section', async () => {
    wrapper = mountWithPlugin(FieldsBuilder, {
      props: { entitySchema: userSchema, modelValue: ['first_name'], 'onUpdate:modelValue': () => {} },
      slots: { actions: '<button class="my-action">go</button>' },
    });
    await flushAll();
    const toolbar = wrapper.find('.qkit-fields-builder-actions');
    expect(toolbar.exists()).toBe(true);
    expect(toolbar.find('button.my-action').exists()).toBe(true);
  });

  it('does not render the actions toolbar without an #actions slot', async () => {
    mountBuilder();
    await flushAll();
    expect(wrapper.find('.qkit-fields-builder-actions').exists()).toBe(false);
  });
});
