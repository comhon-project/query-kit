import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, h } from 'vue';
import UniqueInput from '@components/Filter/UniqueInput.vue';
import { resolve, registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { registerTypeInputs } from '@core/InputManager';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { builderConfigProvide } from '@tests/helpers/provideConfig';
import { flushAll } from '@tests/helpers/flushAsync';
import { locale } from '@i18n/i18n';
import type { VueWrapper } from '@vue/test-utils';
import type { EntitySchema } from '@core/EntitySchema';

let wrapper: VueWrapper;
let schema: EntitySchema;

beforeEach(async () => {
  vi.useFakeTimers();
  registerLoader(entitySchemaLoader);
  registerTranslationsLoader(entityTranslationsLoader);
  registerRequestLoader(requestSchemaLoader);
  schema = await resolve('user');
});

afterEach(() => {
  vi.useRealTimers();
  wrapper?.unmount();
});

function mountInput(target: any, overrides: Record<string, any> = {}) {
  wrapper = mountWithPlugin(UniqueInput, {
    props: {
      target,
      entitySchema: schema,
      multiple: false,
      modelValue: undefined,
      'onUpdate:modelValue': (v: unknown) => wrapper.setProps({ modelValue: v }),
      ...overrides,
    },
    global: { provide: builderConfigProvide() },
  });
}

describe('UniqueInput', () => {
  it('renders native HTML input for string property', async () => {
    const property = schema.getProperty('first_name');
    mountInput(property);
    await flushAll();
    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    expect(input.attributes('type')).toBe('text');
  });

  it('renders native HTML input for integer property', async () => {
    const property = schema.getProperty('age');
    mountInput(property);
    await flushAll();
    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    expect(input.attributes('type')).toBe('number');
  });

  it('renders Vue component for boolean property', async () => {
    const property = schema.getProperty('married');
    mountInput(property);
    await flushAll();
    // BooleanInput is a Vue component, not a native input with type
    // It should render without an input[type=text/number]
    expect(wrapper.find('input[type="text"]').exists()).toBe(false);
    expect(wrapper.find('input[type="number"]').exists()).toBe(false);
  });

  it('renders InvalidType for property with no registered component', async () => {
    const property = schema.getProperty('country');
    mountInput(property);
    await flushAll();
    expect(wrapper.text()).toContain('country');
  });

  it('disables input when editable is false', async () => {
    const property = schema.getProperty('first_name');
    mountInput(property, { editable: false });
    await flushAll();
    const input = wrapper.find('input');
    expect(input.attributes('disabled')).toBeDefined();
  });

  it('sets aria-label from property translation', async () => {
    const property = schema.getProperty('first_name');
    mountInput(property);
    await flushAll();
    const input = wrapper.find('input');
    expect(input.attributes('aria-label')).toBe('first name');
  });

  it('debounces the value write to the model (string input)', async () => {
    const property = schema.getProperty('first_name');
    mountInput(property);
    await flushAll();
    const input = wrapper.find('input');

    await input.setValue('john');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined(); // within the debounce window

    vi.advanceTimersByTime(300);
    await flushAll();
    expect(wrapper.emitted('update:modelValue')?.pop()?.[0]).toBe('john');
  });

  it('empties to undefined (after debounce) on an empty string', async () => {
    const property = schema.getProperty('first_name');
    mountInput(property, { modelValue: 'hello' });
    await flushAll();
    const input = wrapper.find('input');

    await input.setValue('');
    vi.advanceTimersByTime(300);
    await flushAll();
    expect(wrapper.emitted('update:modelValue')?.pop()?.[0]).toBeUndefined();
  });

  it('trims surrounding whitespace (after debounce)', async () => {
    const property = schema.getProperty('first_name');
    mountInput(property);
    await flushAll();
    const input = wrapper.find('input');

    await input.setValue('  john  ');
    vi.advanceTimersByTime(300);
    await flushAll();
    expect(wrapper.emitted('update:modelValue')?.pop()?.[0]).toBe('john');
  });

  it('keeps the raw text in the input while emitting a trimmed value (slow typist)', async () => {
    const property = schema.getProperty('first_name');
    mountInput(property);
    await flushAll();
    const input = wrapper.find('input');

    await input.setValue('john '); // trailing space (e.g. before typing the next word)
    vi.advanceTimersByTime(300);
    await flushAll();

    expect((input.element as HTMLInputElement).value).toBe('john '); // display keeps the space
    expect(wrapper.emitted('update:modelValue')?.pop()?.[0]).toBe('john'); // parent gets the trimmed value
  });

  it('empties a whitespace-only string to undefined (trim then empty, after debounce)', async () => {
    const property = schema.getProperty('first_name');
    mountInput(property, { modelValue: 'hello' });
    await flushAll();
    const input = wrapper.find('input');

    await input.setValue('   ');
    vi.advanceTimersByTime(300);
    await flushAll();
    expect(wrapper.emitted('update:modelValue')?.pop()?.[0]).toBeUndefined();
  });

  it('updates aria-label when locale changes', async () => {
    const property = schema.getProperty('first_name');
    mountInput(property);
    await flushAll();

    expect(wrapper.find('input').attributes('aria-label')).toBe('first name');

    locale.value = 'fr';
    await flushAll();

    expect(wrapper.find('input').attributes('aria-label')).toBe('prénom');
  });

  describe('plugin integration', () => {
    it('renders a custom Vue component registered via registerComponents', async () => {
      const CustomStringInput = defineComponent({
        name: 'CustomStringInput',
        props: ['modelValue', 'disabled', 'ariaLabel'],
        render() {
          return h('textarea', { 'data-testid': 'custom-input' }, this.modelValue);
        },
      });
      registerTypeInputs({ string: CustomStringInput });

      const property = schema.getProperty('first_name');
      mountInput(property);
      await flushAll();

      expect(wrapper.find('input[type="text"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="custom-input"]').exists()).toBe(true);
    });

    it('passes timezone props to custom Vue component', async () => {
      const TimezoneAwareInput = defineComponent({
        name: 'TimezoneAwareInput',
        props: ['modelValue', 'userTimezone', 'requestTimezone', 'disabled', 'ariaLabel', 'entitySchema', 'target', 'multiple'],
        render() {
          return h('div', { 'data-user-tz': this.userTimezone, 'data-req-tz': this.requestTimezone });
        },
      });
      registerTypeInputs({ string: TimezoneAwareInput });

      const property = schema.getProperty('first_name');
      mountInput(property);
      await flushAll();

      const el = wrapper.find('[data-user-tz]');
      expect(el.attributes('data-user-tz')).toBe('UTC');
      expect(el.attributes('data-req-tz')).toBe('UTC');
    });
  });
});
