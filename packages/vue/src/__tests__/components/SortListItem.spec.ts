import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import SortListItem from '@components/Collection/SortListItem.vue';
import PropertyPathEditor from '@components/Collection/PropertyPathEditor.vue';
import { resolve, registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { flushAll } from '@tests/helpers/flushAsync';
import type { EntitySchema } from '@core/EntitySchema';
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

function mountItem(props: Record<string, unknown> = {}) {
  wrapper = mountWithPlugin(SortListItem, {
    props: {
      entitySchema: userSchema,
      field: 'first_name',
      order: 'asc',
      'onUpdate:field': () => {},
      'onUpdate:order': () => {},
      ...props,
    },
  });
}

describe('SortListItem', () => {
  it('renders the resolved field label', async () => {
    mountItem();
    await flushAll();
    expect(wrapper.text()).toContain('first name');
  });

  it('reflects the order model in the select', async () => {
    mountItem({ order: 'desc' });
    await flushAll();
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('desc');
  });

  it('emits the new order when the select changes', async () => {
    mountItem({ order: 'asc' });
    await flushAll();
    await wrapper.find('select').setValue('desc');
    expect(wrapper.emitted('update:order')!.at(-1)).toEqual(['desc']);
  });

  it('shows the open label without a path editor for an open custom field', async () => {
    mountItem({ field: 'age_weight', open: true, label: 'age / weight' });
    await flushAll();
    expect(wrapper.text()).toContain('age / weight');
  });

  it('uses the path editor (drilling) when fixedPath is not set', async () => {
    mountItem({ field: 'company' });
    await flushAll();
    expect(wrapper.findComponent(PropertyPathEditor).exists()).toBe(true);
  });

  it('shows a fixed field label with no path editor when fixedPath is set', async () => {
    mountItem({ field: 'company', fixedPath: true });
    await flushAll();
    expect(wrapper.findComponent(PropertyPathEditor).exists()).toBe(false);
    expect(wrapper.text()).toContain('the company');
    const labels = wrapper.findAll('button').map((b) => b.attributes('aria-label') ?? '');
    expect(labels.some((l) => l.includes('add'))).toBe(false);
    expect(labels.some((l) => l.includes('remove'))).toBe(false);
  });

  it('labels the order select by its field via aria-labelledby (not a generic aria-label)', async () => {
    mountItem();
    await flushAll();
    const select = wrapper.find('select');
    expect(select.attributes('aria-label')).toBeUndefined();
    const labelledby = select.attributes('aria-labelledby');
    expect(labelledby).toBeTruthy();
    const labelEl = wrapper.find(`#${labelledby}`);
    expect(labelEl.exists()).toBe(true);
    expect(labelEl.text()).toContain('first name');
  });

  it('emits remove when the delete button is clicked', async () => {
    mountItem();
    await flushAll();
    const del = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('delete'));
    await del!.trigger('click');
    expect(wrapper.emitted('remove')).toHaveLength(1);
  });

  it('emits grip-start on grip mousedown', async () => {
    mountItem();
    await flushAll();
    const grip = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('reorder'));
    await grip!.trigger('mousedown');
    expect(wrapper.emitted('grip-start')).toBeTruthy();
  });
});
