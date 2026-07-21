import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import PropertyPathEditor from '@components/Collection/PropertyPathEditor.vue';
import { resolve, registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { flushAll } from '@tests/helpers/flushAsync';
import type { EntitySchema } from '@core/EntitySchema';
import type { VueWrapper } from '@vue/test-utils';

// Sortability is resolved per target ENTITY (like core isPropertySortable): the entity schema
// nests metadata(entity 'user.metadata') -> address(entity 'user.address') -> city. Declare a
// sortable list per entity so the chain is drillable. Local loader keeps shared assets intact.
const drillableRequestLoader = {
  load: async (id: string) => {
    if (id === 'user') return { sortable: ['first_name', 'metadata'] };
    if (id === 'user.metadata') return { sortable: ['label', 'address'] };
    if (id === 'user.address') return { sortable: ['city'] };
    return null;
  },
};

let userSchema: EntitySchema;
let wrapper: VueWrapper;

beforeEach(async () => {
  registerLoader(entitySchemaLoader);
  registerTranslationsLoader(entityTranslationsLoader);
  registerRequestLoader(drillableRequestLoader);
  userSchema = await resolve('user');
});

afterEach(() => wrapper?.unmount());

function mountEditor(field: string, onUpdate: (v: string) => void = () => {}) {
  wrapper = mountWithPlugin(PropertyPathEditor, {
    props: { entitySchema: userSchema, sortableOnly: true, modelValue: field, 'onUpdate:modelValue': onUpdate },
  });
}

const addButton = () => wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('add'));
const minusButton = () => wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('remove'));
const drillOptions = () =>
  wrapper
    .find('select')
    .findAll('option')
    .filter((o) => o.attributes('disabled') === undefined)
    .map((o) => o.attributes('value'));

describe('PropertyPathEditor (sortableOnly)', () => {
  it('shows no expand control for a scalar sortable field', async () => {
    mountEditor('first_name');
    await flushAll();
    expect(wrapper.text()).toContain('first name');
    expect(addButton()).toBeUndefined();
  });

  it('offers the target entity sortable children when expanding a relation', async () => {
    mountEditor('metadata');
    await flushAll();
    expect(addButton()).toBeTruthy();
    await addButton()!.trigger('click');
    await flushAll();
    // getSortableProperties('user.metadata') = ['label', 'address']; 'description' is not sortable.
    expect(drillOptions()).toEqual(['label', 'address']);
  });

  it('drills into a sortable child, updating the path', async () => {
    const model = { value: 'metadata' };
    mountEditor(model.value, (v) => (model.value = v));
    await flushAll();
    await addButton()!.trigger('click');
    await flushAll();
    await wrapper.find('select').setValue('label');
    await flushAll();
    expect(model.value).toBe('metadata.label');
  });

  it('prolongs the path through a nested relation to reach a deeper sortable property', async () => {
    let path = 'metadata';
    mountEditor(path, (v) => {
      path = v;
      wrapper.setProps({ modelValue: v });
    });
    await flushAll();

    await addButton()!.trigger('click');
    await flushAll();
    await wrapper.find('select').setValue('address');
    await flushAll();
    expect(path).toBe('metadata.address');

    // The relation is still expandable, now offering its target entity's sortable child.
    await addButton()!.trigger('click');
    await flushAll();
    expect(drillOptions()).toEqual(['city']);

    await wrapper.find('select').setValue('city');
    await flushAll();
    expect(path).toBe('metadata.address.city');
  });

  it('reduces a drilled path back up one level', async () => {
    const model = { value: 'metadata.address' };
    mountEditor(model.value, (v) => (model.value = v));
    await flushAll();
    await minusButton()!.trigger('click');
    await flushAll();
    expect(model.value).toBe('metadata');
  });
});
