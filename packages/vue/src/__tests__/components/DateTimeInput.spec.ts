import { describe, it, expect, vi } from 'vitest';
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

  it('emits undefined when input is cleared', async () => {
    const onUpdate = vi.fn();
    const wrapper = mount(DateTimeInput, {
      props: {
        modelValue: '2024-06-15T14:30:00.000Z',
        userTimezone: 'UTC',
        requestTimezone: 'UTC',
        'onUpdate:modelValue': onUpdate,
      },
    });
    await wrapper.find('input').setValue('');
    expect(onUpdate).toHaveBeenCalledWith(undefined);
  });

  it('converts user input back to request timezone ISO string', async () => {
    const onUpdate = vi.fn();
    const wrapper = mount(DateTimeInput, {
      props: {
        modelValue: null,
        userTimezone: 'UTC',
        requestTimezone: 'UTC',
        'onUpdate:modelValue': onUpdate,
      },
    });
    await wrapper.find('input').setValue('2024-06-15T14:30');
    expect(onUpdate).toHaveBeenCalled();
    const emitted = onUpdate.mock.calls[0][0];
    expect(typeof emitted).toBe('string');
    expect(emitted).toContain('2024-06-15');
  });
});
