import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import BooleanInput from '@components/Common/BooleanInput.vue';
import { locale, loadedTranslations } from '@i18n/i18n';

describe('BooleanInput', () => {
  it('renders two radio buttons', () => {
    const wrapper = mount(BooleanInput, { props: { disabled: false, modelValue: true } });
    const radios = wrapper.findAll('input[type="radio"]');
    expect(radios).toHaveLength(2);
  });

  it('checks "yes" radio when modelValue is true', () => {
    const wrapper = mount(BooleanInput, { props: { disabled: false, modelValue: true } });
    const radios = wrapper.findAll('input[type="radio"]');
    expect((radios[0].element as HTMLInputElement).checked).toBe(true);
    expect((radios[1].element as HTMLInputElement).checked).toBe(false);
  });

  it('checks "no" radio when modelValue is false', () => {
    const wrapper = mount(BooleanInput, { props: { disabled: false, modelValue: false } });
    const radios = wrapper.findAll('input[type="radio"]');
    expect((radios[0].element as HTMLInputElement).checked).toBe(false);
    expect((radios[1].element as HTMLInputElement).checked).toBe(true);
  });

  it('emits update:modelValue true when "yes" radio is clicked', async () => {
    const wrapper = mount(BooleanInput, {
      props: { disabled: false, modelValue: false, 'onUpdate:modelValue': () => {} },
    });
    await wrapper.findAll('input[type="radio"]')[0].trigger('input');
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([true]);
  });

  it('emits update:modelValue false when "no" radio is clicked', async () => {
    const wrapper = mount(BooleanInput, {
      props: { disabled: false, modelValue: true, 'onUpdate:modelValue': () => {} },
    });
    await wrapper.findAll('input[type="radio"]')[1].trigger('input');
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false]);
  });

  it('disables both radios when disabled', () => {
    const wrapper = mount(BooleanInput, { props: { disabled: true, modelValue: true } });
    const radios = wrapper.findAll('input[type="radio"]');
    expect((radios[0].element as HTMLInputElement).disabled).toBe(true);
    expect((radios[1].element as HTMLInputElement).disabled).toBe(true);
  });

  it('renders translated labels', () => {
    const wrapper = mount(BooleanInput, { props: { disabled: false, modelValue: true } });
    expect(wrapper.text()).toContain('yes');
    expect(wrapper.text()).toContain('no');
  });

  it('has a screen-reader legend', () => {
    const wrapper = mount(BooleanInput, { props: { disabled: false, modelValue: true } });
    expect(wrapper.find('legend').text()).toBe('boolean choice');
  });

  it('updates translations when locale changes', async () => {
    const wrapper = mount(BooleanInput, { props: { disabled: false, modelValue: true } });
    expect(wrapper.text()).toContain('yes');

    loadedTranslations['fr'] = { yes: 'oui', no: 'non', boolean_choice: 'choix booléen' };
    locale.value = 'fr';
    await nextTick();

    expect(wrapper.text()).toContain('oui');
    expect(wrapper.text()).toContain('non');
    expect(wrapper.find('legend').text()).toBe('choix booléen');
  });
});
