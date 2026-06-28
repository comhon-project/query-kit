import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import FieldsEditor from '@components/Collection/FieldsEditor.vue';
import { resolve, registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { locale, loadedTranslations } from '@i18n/i18n';
import fr from '@i18n/locales/fr';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { flushAll } from '@tests/helpers/flushAsync';
import type { EntitySchema } from '@core/EntitySchema';
import type { DOMWrapper, VueWrapper } from '@vue/test-utils';

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

async function mount(modelValue: string[], onUpdate: (v: string[]) => void = () => {}): Promise<void> {
  wrapper = mountWithPlugin(FieldsEditor, {
    props: { entitySchema: userSchema, modelValue, 'onUpdate:modelValue': onUpdate },
  });
  await flushAll();
}

function findButton(scope: VueWrapper | DOMWrapper<Element>, label: string): DOMWrapper<HTMLButtonElement> | undefined {
  return scope.findAll('button').find((b) => b.attributes('aria-label')?.includes(label));
}

async function openModal(): Promise<void> {
  await findButton(wrapper, 'columns')!.trigger('click');
  await flushAll();
}

function findModalButton(label: string): DOMWrapper<HTMLButtonElement> | undefined {
  return findButton(wrapper.find('dialog'), label);
}

describe('FieldsEditor', () => {
  it('opens the modal on columns button click', async () => {
    await mount(['first_name']);
    expect(wrapper.find('dialog').attributes('visible')).toBeUndefined();

    await openModal();
    expect(wrapper.find('dialog').attributes('visible')).toBe('');
  });

  it('hosts the FieldsBuilder inside the modal body', async () => {
    await mount(['first_name', 'last_name']);
    await openModal();

    expect(wrapper.find('dialog ul').exists()).toBe(true);
    expect(wrapper.findAll('dialog li').length).toBe(2);
  });

  it('does not propagate edits to v-model until confirm', async () => {
    const modelValue = ref(['first_name', 'last_name']);
    await mount(modelValue.value, (v) => { modelValue.value = v; });
    await openModal();

    await findButton(wrapper.find('li'), 'delete')!.trigger('click');
    await flushAll();
    expect(modelValue.value).toEqual(['first_name', 'last_name']);

    await findModalButton('confirm')!.trigger('click');
    await flushAll();
    expect(modelValue.value).toEqual(['last_name']);
  });

  it('does not update v-model on cancel and resets the draft on next open', async () => {
    const modelValue = ref(['first_name', 'last_name']);
    await mount(modelValue.value, (v) => { modelValue.value = v; });
    await openModal();

    await findButton(wrapper.find('li'), 'delete')!.trigger('click');
    await flushAll();

    await findModalButton('close')!.trigger('click');
    await flushAll();
    expect(modelValue.value).toEqual(['first_name', 'last_name']);

    await openModal();
    expect(wrapper.findAll('dialog li').length).toBe(2);
  });

  it('disables the confirm button when the draft is empty', async () => {
    await mount(['first_name']);
    await openModal();

    await findButton(wrapper.find('li'), 'delete')!.trigger('click');
    await flushAll();

    expect(findModalButton('confirm')!.attributes('disabled')).toBeDefined();
  });

  it('updates the modal header when the locale changes', async () => {
    loadedTranslations['fr'] = fr;

    await mount(['first_name']);
    await openModal();

    expect(wrapper.find('h1').text()).toBe('columns');

    locale.value = 'fr';
    await flushAll();
    expect(wrapper.find('h1').text()).toBe('colonnes');
  });
});
