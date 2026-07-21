import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import SortList from '@components/Collection/SortList.vue';
import SortListItem from '@components/Collection/SortListItem.vue';
import { useHistory } from '@components/Composable/History';
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

function mountList(
  modelValue: (string | SortItemField)[],
  onUpdate: (v: (string | SortItemField)[]) => void = () => {},
  extra: Record<string, unknown> = {},
) {
  wrapper = mountWithPlugin(SortList, {
    props: {
      entitySchema: userSchema,
      modelValue,
      'onUpdate:modelValue': onUpdate,
      ...extra,
    },
  });
}

const pickerSelect = () => wrapper.find('.qkit-field-picker select');
const addButton = () => wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('add'));
const items = () => wrapper.findAll('li');

describe('SortList', () => {
  it('renders current sort entries as items', async () => {
    mountList([{ field: 'first_name', order: 'asc' }, { field: 'age', order: 'desc' }]);
    await flushAll();
    expect(items().length).toBe(2);
  });

  it('normalizes a bare string entry to an ascending item', async () => {
    mountList(['first_name']);
    await flushAll();
    expect(items().length).toBe(1);
    expect((wrapper.find('li select').element as HTMLSelectElement).value).toBe('asc');
  });

  it('offers every sortable property of the entity minus already-selected (no fields prop)', async () => {
    mountList([{ field: 'first_name', order: 'asc' }]);
    await flushAll();
    const values = pickerSelect()
      .findAll('option')
      .filter((o) => o.attributes('disabled') === undefined)
      .map((o) => o.attributes('value'));
    expect(values).toEqual(['last_name', 'age', 'metadata']);
  });

  it('scopes the pool to the fields prop when provided, dropping non-sortable ones', async () => {
    // 'company' is in fields but not sortable -> excluded.
    mountList([], () => {}, { fields: ['first_name', 'company', 'age'] });
    await flushAll();
    const values = pickerSelect()
      .findAll('option')
      .filter((o) => o.attributes('disabled') === undefined)
      .map((o) => o.attributes('value'));
    expect(values).toEqual(['first_name', 'age']);
  });

  it('excludes an open custom field without a sort config, even if its id is a sortable property', async () => {
    // Mirrors initSort/Header: an open custom field is sortable only via its sort config,
    // never through the schema property its id shadows.
    mountList([], () => {}, { fields: ['first_name'], customFields: { first_name: { label: 'Name', open: true } } });
    await flushAll();
    expect(pickerSelect().exists()).toBe(false);
  });

  it('resolves a nested displayed column to a full label in the picker (not the raw path)', async () => {
    // Make 'company.brand_name' sortable: every segment must be sortable in its parent entity.
    registerRequestLoader({
      load: async (id: string) => {
        if (id === 'user') return { sortable: ['company'] };
        if (id === 'organization') return { sortable: ['brand_name'] };
        return null;
      },
    });
    mountList([], () => {}, { fields: ['company.brand_name'] });
    await flushAll();
    const opts = pickerSelect()
      .findAll('option')
      .filter((o) => o.attributes('disabled') === undefined);
    expect(opts.map((o) => o.attributes('value'))).toEqual(['company.brand_name']);
    expect(opts[0].text()).toBe('the company brand name');
  });

  it('fixes the item path (no drilling) when scoped by fields, but not entity-wide', async () => {
    mountList([{ field: 'first_name', order: 'asc' }], () => {}, { fields: ['first_name'] });
    await flushAll();
    expect(wrapper.findComponent(SortListItem).props('fixedPath')).toBe(true);

    mountList([{ field: 'first_name', order: 'asc' }]);
    await flushAll();
    expect(wrapper.findComponent(SortListItem).props('fixedPath')).toBe(false);
  });

  it('includes custom fields with a sort config in the entity-wide pool', async () => {
    mountList([], () => {}, {
      customFields: { age_weight: { label: 'age / weight', open: true, sort: ['age', 'weight'] } },
    });
    await flushAll();
    const values = pickerSelect()
      .findAll('option')
      .filter((o) => o.attributes('disabled') === undefined)
      .map((o) => o.attributes('value'));
    expect(values).toEqual(['first_name', 'last_name', 'age', 'metadata', 'age_weight']);
  });

  it('clears the pool (no stale options) when the request schema fails after a successful load', async () => {
    mountList([]);
    await flushAll();
    expect(pickerSelect().findAll('option').filter((o) => o.attributes('disabled') === undefined).length).toBeGreaterThan(0);

    // The request schema now fails, and the entity changes: getSortableProperties rejects.
    registerRequestLoader({
      load: async () => {
        throw new Error('boom');
      },
    });
    const orgSchema = await resolve('organization');
    await wrapper.setProps({ entitySchema: orgSchema });
    await flushAll();

    // Pool cleared for the failing entity, not left showing the previous entity's options.
    expect(pickerSelect().exists()).toBe(false);
  });

  it('adds a sort entry (ascending) when a field is picked', async () => {
    const model = ref<(string | SortItemField)[]>([{ field: 'first_name', order: 'asc' }]);
    mountList(model.value, (v) => (model.value = v));
    await flushAll();
    await pickerSelect().setValue('last_name');
    await addButton()!.trigger('click');
    await flushAll();
    expect(model.value).toEqual([
      { field: 'first_name', order: 'asc' },
      { field: 'last_name', order: 'asc' },
    ]);
  });

  it('removes a sort entry', async () => {
    const model = ref<(string | SortItemField)[]>([
      { field: 'first_name', order: 'asc' },
      { field: 'age', order: 'desc' },
    ]);
    mountList(model.value, (v) => (model.value = v));
    await flushAll();
    const del = items()[0].findAll('button').find((b) => b.attributes('aria-label')?.includes('delete'));
    await del!.trigger('click');
    await flushAll();
    expect(model.value).toEqual([{ field: 'age', order: 'desc' }]);
  });

  it('updates the order when a row direction select changes', async () => {
    const model = ref<(string | SortItemField)[]>([{ field: 'first_name', order: 'asc' }]);
    mountList(model.value, (v) => (model.value = v));
    await flushAll();
    await items()[0].find('select').setValue('desc');
    await flushAll();
    expect(model.value).toEqual([{ field: 'first_name', order: 'desc' }]);
  });

  it('reflects external model changes', async () => {
    mountList([{ field: 'first_name', order: 'asc' }]);
    await flushAll();
    expect(items().length).toBe(1);
    await wrapper.setProps({ modelValue: [{ field: 'first_name', order: 'asc' }, { field: 'age', order: 'asc' }] });
    await flushAll();
    expect(items().length).toBe(2);
  });

  it('registers a "sort" history slice that undo reverts', async () => {
    const history = useHistory();
    const model = ref<(string | SortItemField)[]>([{ field: 'first_name', order: 'asc' }]);
    wrapper = mountWithPlugin(SortList, {
      props: {
        entitySchema: userSchema,
        history,
        modelValue: model.value,
        'onUpdate:modelValue': (v: (string | SortItemField)[]) => (model.value = v),
      },
    });
    await flushAll();

    await pickerSelect().setValue('age');
    await addButton()!.trigger('click');
    await flushAll();
    expect(model.value).toHaveLength(2);
    expect(history.canUndo.value).toBe(true);

    history.undo();
    await flushAll();
    expect(model.value).toEqual([{ field: 'first_name', order: 'asc' }]);
  });
});
