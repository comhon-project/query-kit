import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import SortEditor from '@components/Collection/SortEditor.vue';
import { resolve, registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { flushAll } from '@tests/helpers/flushAsync';
import type { EntitySchema } from '@core/EntitySchema';
import type { SortItemField } from '@core/types';
import type { DOMWrapper, VueWrapper } from '@vue/test-utils';

let userSchema: EntitySchema;
let wrapper: VueWrapper;

beforeEach(async () => {
  registerLoader(entitySchemaLoader);
  registerTranslationsLoader(entityTranslationsLoader);
  registerRequestLoader(requestSchemaLoader);
  userSchema = await resolve('user');
});

afterEach(() => wrapper?.unmount());

async function mount(
  fields: string[] | undefined,
  modelValue: (string | SortItemField)[],
  onUpdate: (v: (string | SortItemField)[]) => void = () => {},
  extra: Record<string, unknown> = {},
): Promise<void> {
  wrapper = mountWithPlugin(SortEditor, {
    props: { entitySchema: userSchema, fields, modelValue, 'onUpdate:modelValue': onUpdate, ...extra },
  });
  await flushAll();
}

function findButton(scope: VueWrapper | DOMWrapper<Element>, label: string): DOMWrapper<HTMLButtonElement> | undefined {
  return scope.findAll('button').find((b) => b.attributes('aria-label')?.includes(label));
}

async function openModal(): Promise<void> {
  await findButton(wrapper, 'sort')!.trigger('click');
  await flushAll();
}

describe('SortEditor', () => {
  it('opens the modal on the sort button click', async () => {
    await mount(['first_name', 'age'], []);
    expect(wrapper.find('dialog').attributes('visible')).toBeUndefined();
    await openModal();
    expect(wrapper.find('dialog').attributes('visible')).toBe('');
  });

  it('scopes the pool to displayed columns that are sortable', async () => {
    // 'company' is a displayed column but not in the sortable list -> excluded.
    await mount(['first_name', 'age', 'company'], []);
    await openModal();
    const values = wrapper
      .find('dialog .qkit-field-picker select')
      .findAll('option')
      .filter((o) => o.attributes('disabled') === undefined)
      .map((o) => o.attributes('value'));
    expect(values).toEqual(['first_name', 'age']);
  });

  it('offers every sortable property of the entity when no fields are given', async () => {
    await mount(undefined, []);
    await openModal();
    const values = wrapper
      .find('dialog .qkit-field-picker select')
      .findAll('option')
      .filter((o) => o.attributes('disabled') === undefined)
      .map((o) => o.attributes('value'));
    expect(values).toEqual(['first_name', 'last_name', 'age', 'metadata']);
  });

  it('flags the trigger button with the reflow sort-button class when reflowFallback is set', async () => {
    await mount(['first_name'], [], () => {}, { reflowFallback: true });
    expect(wrapper.find('button.qkit-collection-sort-button').exists()).toBe(true);
  });

  it('uses the default button class without reflowFallback', async () => {
    await mount(['first_name'], []);
    expect(wrapper.find('button.qkit-collection-sort-button').exists()).toBe(false);
  });

  it('does not propagate edits to v-model until confirm', async () => {
    const model = ref<(string | SortItemField)[]>([{ field: 'first_name', order: 'asc' }]);
    await mount(['first_name', 'age'], model.value, (v) => (model.value = v));
    await openModal();

    await findButton(wrapper.find('dialog li'), 'delete')!.trigger('click');
    await flushAll();
    expect(model.value).toEqual([{ field: 'first_name', order: 'asc' }]);

    await findButton(wrapper.find('dialog'), 'confirm')!.trigger('click');
    await flushAll();
    expect(model.value).toEqual([]);
  });

  it('resets the draft on cancel', async () => {
    const model = ref<(string | SortItemField)[]>([{ field: 'first_name', order: 'asc' }]);
    await mount(['first_name', 'age'], model.value, (v) => (model.value = v));
    await openModal();

    await findButton(wrapper.find('dialog li'), 'delete')!.trigger('click');
    await flushAll();
    await findButton(wrapper.find('dialog'), 'close')!.trigger('click');
    await flushAll();
    expect(model.value).toEqual([{ field: 'first_name', order: 'asc' }]);

    await openModal();
    expect(wrapper.findAll('dialog li').length).toBe(1);
  });

  it('reflects an external sort change (e.g. via column headers) when reopened', async () => {
    await mount(['first_name'], []);
    // The sort model changes outside the modal (a header click) while it is closed.
    await wrapper.setProps({ modelValue: [{ field: 'first_name', order: 'desc' }] });
    await openModal();
    const items = wrapper.findAll('dialog li');
    expect(items.length).toBe(1);
    expect((items[0].find('select').element as HTMLSelectElement).value).toBe('desc');
  });
});
