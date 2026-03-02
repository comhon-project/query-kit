import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AdaptativeSelect from '@components/Common/AdaptativeSelect.vue';

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

describe('AdaptativeSelect', () => {
  it('renders a select element', () => {
    const wrapper = mount(AdaptativeSelect, {
      props: { options, modelValue: 'a', 'onUpdate:modelValue': () => {} },
    });
    expect(wrapper.find('select').exists()).toBe(true);
  });

  it('renders all options', () => {
    const wrapper = mount(AdaptativeSelect, {
      props: { options, modelValue: 'a', 'onUpdate:modelValue': () => {} },
    });
    const optionElements = wrapper.findAll('option');
    expect(optionElements).toHaveLength(3);
    expect(optionElements[0].text()).toBe('Alpha');
    expect(optionElements[1].text()).toBe('Beta');
    expect(optionElements[2].text()).toBe('Gamma');
  });

  it('selects the correct option based on modelValue', () => {
    const wrapper = mount(AdaptativeSelect, {
      props: { options, modelValue: 'b', 'onUpdate:modelValue': () => {} },
    });
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('b');
  });

  it('emits update:modelValue on change', async () => {
    const wrapper = mount(AdaptativeSelect, {
      props: { options, modelValue: 'a', 'onUpdate:modelValue': () => {} },
    });
    await wrapper.find('select').setValue('c');
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['c']);
  });

  it('disables select when disabled prop is true', () => {
    const wrapper = mount(AdaptativeSelect, {
      props: { options, modelValue: 'a', disabled: true, 'onUpdate:modelValue': () => {} },
    });
    expect((wrapper.find('select').element as HTMLSelectElement).disabled).toBe(true);
  });

  it('sets aria-label', () => {
    const wrapper = mount(AdaptativeSelect, {
      props: { options, modelValue: 'a', ariaLabel: 'Choose option', 'onUpdate:modelValue': () => {} },
    });
    expect(wrapper.find('select').attributes('aria-label')).toBe('Choose option');
  });

  it('applies custom class', () => {
    const wrapper = mount(AdaptativeSelect, {
      props: { options, modelValue: 'a', class: 'my-select', 'onUpdate:modelValue': () => {} },
    });
    expect(wrapper.find('select').classes()).toContain('my-select');
  });
});
