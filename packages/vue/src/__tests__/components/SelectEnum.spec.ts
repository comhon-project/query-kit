import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import SelectEnum from '@components/Common/SelectEnum.vue';
import { registerLoader, registerTranslationsLoader } from '@core/EnumSchema';
import { locale } from '@i18n/i18n';

describe('SelectEnum', () => {
  beforeEach(() => {
    registerLoader({
      load: async (id) => {
        if (id === 'gender') return { cases: [{ id: 'male', name: 'Male' }, { id: 'female', name: 'Female' }] };
        return null;
      },
    });
  });

  it('renders a select element', async () => {
    const wrapper = mount(SelectEnum, {
      props: { target: { type: 'string', enum: 'gender' }, multiple: false, disabled: false },
    });
    await flushPromises();
    expect(wrapper.find('select').exists()).toBe(true);
  });

  it('loads and renders enum cases as options', async () => {
    const wrapper = mount(SelectEnum, {
      props: { target: { type: 'string', enum: 'gender' }, multiple: false, disabled: false },
    });
    await flushPromises();
    const options = wrapper.findAll('option');
    expect(options).toHaveLength(2);
    expect(options[0].text()).toBe('Male');
    expect(options[1].text()).toBe('Female');
  });

  it('disables select when disabled', async () => {
    const wrapper = mount(SelectEnum, {
      props: { target: { type: 'string', enum: 'gender' }, multiple: false, disabled: true },
    });
    await flushPromises();
    expect((wrapper.find('select').element as HTMLSelectElement).disabled).toBe(true);
  });

  it('sets multiple attribute when multiple is true', async () => {
    const wrapper = mount(SelectEnum, {
      props: { target: { type: 'string', enum: 'gender' }, multiple: true, disabled: false },
    });
    await flushPromises();
    expect((wrapper.find('select').element as HTMLSelectElement).multiple).toBe(true);
  });

  it('emits update:modelValue on change', async () => {
    const wrapper = mount(SelectEnum, {
      props: {
        target: { type: 'string', enum: 'gender' },
        multiple: false,
        disabled: false,
        modelValue: 'male',
        'onUpdate:modelValue': () => {},
      },
    });
    await flushPromises();
    await wrapper.find('select').setValue('female');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
  });

  it('returns empty array for multiple mode when modelValue is null', async () => {
    const wrapper = mount(SelectEnum, {
      props: {
        target: { type: 'string', enum: 'gender' },
        multiple: true,
        disabled: false,
        modelValue: null,
        'onUpdate:modelValue': () => {},
      },
    });
    await flushPromises();
    const select = wrapper.find('select').element as HTMLSelectElement;
    expect(select.selectedOptions).toHaveLength(0);
  });

  it('updates options when locale changes', async () => {
    registerTranslationsLoader({
      load: async (enumId, loc) => {
        if (enumId !== 'gender') return null;
        const translations: Record<string, Record<string, string>> = {
          en: { male: 'Male', female: 'Female' },
          fr: { male: 'Homme', female: 'Femme' },
        };
        return translations[loc] ?? null;
      },
    });

    const wrapper = mount(SelectEnum, {
      props: { target: { type: 'string', enum: 'gender' }, multiple: false, disabled: false },
    });
    await flushPromises();
    expect(wrapper.findAll('option')[0].text()).toBe('Male');

    locale.value = 'fr';
    await flushPromises();
    await nextTick();

    expect(wrapper.findAll('option')[0].text()).toBe('Homme');
    expect(wrapper.findAll('option')[1].text()).toBe('Femme');
  });
});
