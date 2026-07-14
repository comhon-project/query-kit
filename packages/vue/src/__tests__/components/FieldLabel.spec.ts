import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { nextTick } from 'vue';
import FieldLabel from '@components/Collection/FieldLabel.vue';
import InvalidField from '@components/Messages/InvalidField.vue';
import { resolveFieldLabel } from '@components/Composable/ColumnLabels';
import { resolve, registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { locale } from '@i18n/i18n';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { flushAll } from '@tests/helpers/flushAsync';
import type { EntitySchema } from '@core/EntitySchema';
import type { VueWrapper } from '@vue/test-utils';

vi.mock('@components/Composable/ColumnLabels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@components/Composable/ColumnLabels')>();
  return { ...actual, resolveFieldLabel: vi.fn(actual.resolveFieldLabel) };
});

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

describe('FieldLabel', () => {
  it('resolves the property path label when not open', async () => {
    wrapper = mountWithPlugin(FieldLabel, {
      props: { entitySchema: userSchema, fieldId: 'first_name' },
    });
    await flushAll();
    expect(wrapper.text()).toBe('first name');
  });

  // Regression guard: a string label MUST render inside a <span>, not as a bare text node.
  // The editor's .qkit-field-editor-list-item is flex and styles its children via
  // `> *:not(.qkit-input)`; a text node is skipped, so the label loses its chip styling.
  it('wraps a resolved string label in a <span>', async () => {
    wrapper = mountWithPlugin(FieldLabel, {
      props: { entitySchema: userSchema, fieldId: 'first_name' },
    });
    await flushAll();
    const span = wrapper.find('span');
    expect(span.exists()).toBe(true);
    expect(span.text()).toBe('first name');
  });

  it('renders InvalidField for an unresolvable property path', async () => {
    wrapper = mountWithPlugin(FieldLabel, {
      props: { entitySchema: userSchema, fieldId: 'nonexistent_field' },
    });
    await flushAll();
    expect(wrapper.findComponent(InvalidField).exists()).toBe(true);
  });

  it('displays label string when open', async () => {
    wrapper = mountWithPlugin(FieldLabel, {
      props: { entitySchema: userSchema, fieldId: 'custom', open: true, label: 'My Field' },
    });
    await flushAll();
    expect(wrapper.text()).toBe('My Field');
  });

  it('calls label function with locale when open', async () => {
    const labelFn = (loc: string) => (loc === 'en' ? 'English Label' : 'French Label');
    wrapper = mountWithPlugin(FieldLabel, {
      props: { entitySchema: userSchema, fieldId: 'custom', open: true, label: labelFn },
    });
    await flushAll();
    expect(wrapper.text()).toBe('English Label');
  });

  it('renders nothing when open without a label', async () => {
    wrapper = mountWithPlugin(FieldLabel, {
      props: { entitySchema: userSchema, fieldId: 'custom', open: true },
    });
    await flushAll();
    expect(wrapper.text()).toBe('');
  });

  it('uses the custom label when not open', async () => {
    wrapper = mountWithPlugin(FieldLabel, {
      props: { entitySchema: userSchema, fieldId: 'first_name', label: 'Custom' },
    });
    await flushAll();
    expect(wrapper.text()).toBe('Custom');
  });

  it('re-calls label function when locale changes', async () => {
    const labelFn = (loc: string) => (loc === 'en' ? 'English Label' : 'French Label');
    wrapper = mountWithPlugin(FieldLabel, {
      props: { entitySchema: userSchema, fieldId: 'custom', open: true, label: labelFn },
    });
    await flushAll();
    expect(wrapper.text()).toBe('English Label');

    locale.value = 'fr';
    await flushAll();
    expect(wrapper.text()).toBe('French Label');
  });

  it('ignores a slow earlier resolution superseded by a faster later one', async () => {
    let resolveSlow!: (v: string) => void;
    let resolveFast!: (v: string) => void;
    const slow = new Promise<string>((r) => (resolveSlow = r));
    const fast = new Promise<string>((r) => (resolveFast = r));
    vi.mocked(resolveFieldLabel).mockReturnValueOnce(slow).mockReturnValueOnce(fast);

    wrapper = mountWithPlugin(FieldLabel, { props: { entitySchema: userSchema, fieldId: 'slow' } });
    await nextTick();
    await wrapper.setProps({ fieldId: 'fast' });
    await nextTick();

    resolveFast('later label');
    await flushAll();
    expect(wrapper.text()).toBe('later label');

    resolveSlow('stale label');
    await flushAll();
    expect(wrapper.text()).toBe('later label');
  });
});
