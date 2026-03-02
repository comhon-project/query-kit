import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DateTimeInput from '@components/Common/DateTimeInput.vue';

describe('DateTimeInput', () => {
  it('renders a datetime-local input', () => {
    const wrapper = mount(DateTimeInput, { props: { modelValue: null, 'onUpdate:modelValue': () => {} } });
    expect(wrapper.find('input[type="datetime-local"]').exists()).toBe(true);
  });

  it('has step="60"', () => {
    const wrapper = mount(DateTimeInput, { props: { modelValue: null, 'onUpdate:modelValue': () => {} } });
    expect(wrapper.find('input').attributes('step')).toBe('60');
  });

  it('disables input when disabled', () => {
    const wrapper = mount(DateTimeInput, {
      props: { modelValue: null, disabled: true, 'onUpdate:modelValue': () => {} },
    });
    expect((wrapper.find('input').element as HTMLInputElement).disabled).toBe(true);
  });

  it('displays null for null modelValue', () => {
    const wrapper = mount(DateTimeInput, { props: { modelValue: null, 'onUpdate:modelValue': () => {} } });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');
  });

  it('converts UTC ISO value to local datetime format', () => {
    const wrapper = mount(DateTimeInput, {
      props: {
        modelValue: '2024-06-15T14:30:00.000Z',
        userTimezone: 'UTC',
        requestTimezone: 'UTC',
        'onUpdate:modelValue': () => {},
      },
    });
    const input = wrapper.find('input').element as HTMLInputElement;
    expect(input.value).toContain('2024-06-15');
    expect(input.value).toContain('14:30');
  });

  it('converts between timezones on display', () => {
    const wrapper = mount(DateTimeInput, {
      props: {
        modelValue: '2024-06-15T20:00:00.000Z',
        requestTimezone: 'UTC',
        userTimezone: 'America/New_York',
        'onUpdate:modelValue': () => {},
      },
    });
    const input = wrapper.find('input').element as HTMLInputElement;
    // UTC 20:00 = New York 16:00 (EDT in June)
    expect(input.value).toContain('16:00');
  });

  it('applies input class', () => {
    const wrapper = mount(DateTimeInput, { props: { modelValue: null, 'onUpdate:modelValue': () => {} } });
    expect(wrapper.find('input').classes()).toContain('qkit-input');
  });
});
