import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ArrayableInput from '@components/Filter/ArrayableInput.vue';
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

function mountArrayable(target: any, overrides: Record<string, any> = {}) {
  wrapper = mountWithPlugin(ArrayableInput, {
    props: {
      target,
      entitySchema: schema,
      modelValue: undefined,
      'onUpdate:modelValue': (v: unknown) => wrapper.setProps({ modelValue: v }),
      ...overrides,
    },
    global: { provide: builderConfigProvide() },
  });
}

describe('ArrayableInput', () => {
  it('renders UniqueInput when isArray is false', async () => {
    const property = schema.getProperty('first_name');
    mountArrayable(property, { isArray: false });
    await flushAll();
    expect(wrapper.findComponent(UniqueInput).exists()).toBe(true);
    expect(wrapper.findComponent(CollectionInput).exists()).toBe(false);
  });

  it('renders CollectionInput when isArray is true and component does not support multiple', async () => {
    // first_name is string type → 'text' native input, does NOT support multiple
    const property = schema.getProperty('first_name');
    mountArrayable(property, { isArray: true, modelValue: [] });
    await flushAll();
    expect(wrapper.findComponent(CollectionInput).exists()).toBe(true);
  });

  it('renders UniqueInput with multiple when isArray is true and component supports multiple', async () => {
    // gender is enum type → SelectEnum via MultipleCapableComponent, DOES support multiple
    const property = schema.getProperty('gender');
    mountArrayable(property, { isArray: true });
    await flushAll();
    expect(wrapper.findComponent(UniqueInput).exists()).toBe(true);
    expect(wrapper.findComponent(CollectionInput).exists()).toBe(false);
    expect(wrapper.findComponent(UniqueInput).props('multiple')).toBe(true);
  });

  it('passes editable prop through', async () => {
    const property = schema.getProperty('first_name');
    mountArrayable(property, { editable: false });
    await flushAll();
    expect(wrapper.findComponent(UniqueInput).props('editable')).toBe(false);
  });
});
