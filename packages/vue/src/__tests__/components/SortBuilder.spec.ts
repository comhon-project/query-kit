import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import SortBuilder from '@components/Collection/SortBuilder.vue';
import SortList from '@components/Collection/SortList.vue';
import { resolve, registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { flushAll } from '@tests/helpers/flushAsync';
import type { EntitySchema } from '@core/EntitySchema';
import type { SortItemField } from '@core/types';
import type { VueWrapper } from '@vue/test-utils';

let userSchema: EntitySchema;
let wrapper: VueWrapper;

beforeEach(async () => {
  registerLoader(entitySchemaLoader);
  registerTranslationsLoader(entityTranslationsLoader);
  registerRequestLoader(requestSchemaLoader);
  userSchema = await resolve('user');
});

afterEach(() => wrapper?.unmount());

function mountBuilder(props: Record<string, unknown> = {}) {
  wrapper = mountWithPlugin(SortBuilder, {
    props: {
      entitySchema: userSchema,
      modelValue: [{ field: 'first_name', order: 'asc' }] as SortItemField[],
      'onUpdate:modelValue': () => {},
      ...props,
    },
  });
}

describe('SortBuilder', () => {
  it('wraps the SortList in a section.qkit-sort-builder labelled "sort"', async () => {
    mountBuilder();
    await flushAll();
    const section = wrapper.find('section.qkit-sort-builder');
    expect(section.exists()).toBe(true);
    const label = section.find('.qkit-builder-label');
    expect(label.text()).toBe('sort');
    expect(section.attributes('aria-labelledby')).toBe(label.attributes('id'));
    expect(wrapper.findComponent(SortList).exists()).toBe(true);
  });

  const pickerValues = () =>
    wrapper
      .find('.qkit-field-picker select')
      .findAll('option')
      .filter((o) => o.attributes('disabled') === undefined)
      .map((o) => o.attributes('value'));

  it('offers every sortable property of the entity (unscoped, no fields prop)', async () => {
    mountBuilder({ modelValue: [] });
    await flushAll();
    expect(wrapper.findComponent(SortList).props('fields')).toBeUndefined();
    expect(pickerValues()).toEqual(['first_name', 'last_name', 'age', 'metadata']);
  });

  it('includes custom fields declaring a sort config in the pool', async () => {
    mountBuilder({
      modelValue: [],
      customFields: { age_weight: { label: 'age / weight', open: true, sort: ['age', 'weight'] } },
    });
    await flushAll();
    expect(pickerValues()).toContain('age_weight');
  });

  it('propagates a SortList model update to its own model', async () => {
    mountBuilder();
    await flushAll();
    wrapper.findComponent(SortList).vm.$emit('update:modelValue', [{ field: 'age', order: 'desc' }]);
    await flushAll();
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual([{ field: 'age', order: 'desc' }]);
  });

  it('renders the #actions slot in a toolbar inside the section', async () => {
    wrapper = mountWithPlugin(SortBuilder, {
      props: { entitySchema: userSchema, modelValue: [], 'onUpdate:modelValue': () => {} },
      slots: { actions: '<button class="my-action">go</button>' },
    });
    await flushAll();
    const toolbar = wrapper.find('.qkit-sort-builder-actions');
    expect(toolbar.exists()).toBe(true);
    expect(toolbar.find('button.my-action').exists()).toBe(true);
  });
});
