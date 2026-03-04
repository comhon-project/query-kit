import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { nextTick, reactive } from 'vue';
import Condition from '@components/Filter/Condition.vue';
import InvalidProperty from '@components/Messages/InvalidProperty.vue';
import InvalidOperator from '@components/Messages/InvalidOperator.vue';
import InvalidType from '@components/Messages/InvalidType.vue';
import AdaptativeSelect from '@components/Common/AdaptativeSelect.vue';
import ArrayableInput from '@components/Filter/ArrayableInput.vue';
import { resolve, registerLoader, registerTranslationsLoader, loadRawTranslations } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { builderConfigProvide } from '@tests/helpers/provideConfig';
import { flushAll } from '@tests/helpers/flushAsync';
import { locale } from '@i18n/i18n';
import type { VueWrapper } from '@vue/test-utils';
import type { EntitySchema } from '@core/EntitySchema';
import type { ConditionFilter } from '@core/types';

let wrapper: VueWrapper;
let schema: EntitySchema;

beforeEach(async () => {
  registerLoader(entitySchemaLoader);
  registerTranslationsLoader(entityTranslationsLoader);
  registerRequestLoader(requestSchemaLoader);
  schema = await resolve('user');
});

afterEach(() => {
  wrapper?.unmount();
});

function mountCondition(filter: ConditionFilter, configOverrides: Record<string, unknown> = {}) {
  wrapper = mountWithPlugin(Condition, {
    props: {
      modelValue: filter,
      entitySchema: schema,
    },
    global: { provide: builderConfigProvide(configOverrides) },
  });
}

describe('Condition', () => {
  it('renders property label and operator select for valid condition', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: '=',
      value: 'Alice',
      key: 1,
    });
    mountCondition(filter);
    await flushAll();

    expect(wrapper.text()).toContain('first name');
    expect(wrapper.findComponent(AdaptativeSelect).exists()).toBe(true);
  });

  it('renders value input (ArrayableInput) for valid condition', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: '=',
      value: 'Alice',
      key: 2,
    });
    mountCondition(filter);
    await flushAll();

    expect(wrapper.findComponent(ArrayableInput).exists()).toBe(true);
  });

  it('hides value input for null operator', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: 'null',
      key: 3,
    });
    mountCondition(filter);
    await flushAll();

    expect(wrapper.findComponent(ArrayableInput).exists()).toBe(false);
  });

  it('hides value input for not_null operator', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: 'not_null',
      key: 4,
    });
    mountCondition(filter);
    await flushAll();

    expect(wrapper.findComponent(ArrayableInput).exists()).toBe(false);
  });

  it('shows InvalidProperty for unknown property', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'nonexistent',
      operator: '=',
      key: 5,
    });
    mountCondition(filter);
    await flushAll();

    expect(wrapper.findComponent(InvalidProperty).exists()).toBe(true);
    expect(wrapper.text()).toContain('nonexistent');
  });

  it('shows InvalidOperator for invalid operator', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: 'invalid_op',
      key: 6,
    });
    mountCondition(filter);
    await flushAll();

    expect(wrapper.findComponent(InvalidOperator).exists()).toBe(true);
    expect(wrapper.text()).toContain('invalid_op');
  });

  it('shows InvalidType for country property (choice type)', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'country',
      operator: '=',
      key: 7,
    });
    mountCondition(filter);
    await flushAll();

    expect(wrapper.findComponent(InvalidType).exists()).toBe(true);
    expect(wrapper.text()).toContain('choice');
  });

  it('emits remove when delete button clicked', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: '=',
      value: 'test',
      key: 8,
    });
    mountCondition(filter);
    await flushAll();

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('remove')).toBeTruthy();
    expect(wrapper.emitted('remove')!.length).toBe(1);
  });

  it('hides delete button when removable=false', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: '=',
      value: 'test',
      removable: false,
      key: 9,
    });
    mountCondition(filter);
    await flushAll();

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('disables operator when editable=false', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: '=',
      value: 'test',
      editable: false,
      key: 10,
    });
    mountCondition(filter);
    await flushAll();

    const select = wrapper.findComponent(AdaptativeSelect);
    expect(select.exists()).toBe(true);
    expect(select.props('disabled')).toBe(true);
  });

  it('converts array value to single when switching from in to eq', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: 'in',
      value: ['a', 'b'],
      key: 11,
    });
    mountCondition(filter);
    await flushAll();

    filter.operator = '=';
    await nextTick();

    expect(filter.value).toBe('a');
  });

  it('converts single value to array when switching from eq to in', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: '=',
      value: 'hello',
      key: 12,
    });
    mountCondition(filter);
    await flushAll();

    filter.operator = 'in';
    await nextTick();

    expect(filter.value).toEqual(['hello']);
  });

  it('hides operator select when displayOperator=false', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: '=',
      value: 'test',
      key: 13,
    });
    mountCondition(filter, { displayOperator: false });
    await flushAll();

    expect(wrapper.findComponent(AdaptativeSelect).exists()).toBe(false);
  });

  it('updates property label when locale changes', async () => {
    await loadRawTranslations('user', 'fr');

    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: '=',
      value: 'test',
      key: 14,
    });
    mountCondition(filter);
    await flushAll();

    expect(wrapper.text()).toContain('first name');

    locale.value = 'fr';
    await flushAll();

    expect(wrapper.text()).toContain('prénom');
  });

  it('updates operator label when locale changes', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: 'like',
      value: 'test',
      key: 15,
    });
    mountCondition(filter);

    const select = wrapper.findComponent(AdaptativeSelect);
    const likeOption = select.findAll('option').find((o) => o.element.value === 'like');
    expect(likeOption?.text()).toBe('contains');

    locale.value = 'fr';
    await flushAll();

    const updatedOption = select.findAll('option').find((o) => o.element.value === 'like');
    expect(updatedOption?.text()).toBe('contient');
  });

  it('sets value to undefined when switching to null operator', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: '=',
      value: 'hello',
      key: 16,
    });
    mountCondition(filter);
    await flushAll();

    filter.operator = 'null';
    await nextTick();

    expect(filter.value).toBeUndefined();
  });

  it('sets value to undefined when switching to not_null operator', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: '=',
      value: 'hello',
      key: 17,
    });
    mountCondition(filter);
    await flushAll();

    filter.operator = 'not_null';
    await nextTick();

    expect(filter.value).toBeUndefined();
  });

  it('converts empty array to undefined when switching from in to eq', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: 'in',
      value: [],
      key: 18,
    });
    mountCondition(filter);
    await flushAll();

    filter.operator = '=';
    await nextTick();

    expect(filter.value).toBeUndefined();
  });

  it('keeps undefined value when switching from eq to in with no value', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: '=',
      value: undefined,
      key: 19,
    });
    mountCondition(filter);
    await flushAll();

    filter.operator = 'in';
    await nextTick();

    expect(filter.value).toEqual([undefined]);
  });

  it('shows operator when displayOperator.condition is true', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: '=',
      value: 'test',
      key: 20,
    });
    mountCondition(filter, { displayOperator: { condition: true } });
    await flushAll();

    expect(wrapper.findComponent(AdaptativeSelect).exists()).toBe(true);
  });

  it('hides operator when displayOperator.condition is false', async () => {
    const filter: ConditionFilter = reactive({
      type: 'condition',
      property: 'first_name',
      operator: '=',
      value: 'test',
      key: 21,
    });
    mountCondition(filter, { displayOperator: { condition: false } });
    await flushAll();

    expect(wrapper.findComponent(AdaptativeSelect).exists()).toBe(false);
  });

  describe('plugin integration', () => {
    it('restricts operator options via allowedOperators config', async () => {
      const filter: ConditionFilter = reactive({
        type: 'condition',
        property: 'first_name',
        operator: '=',
        value: 'test',
        key: 22,
      });
      mountCondition(filter, {
        allowedOperators: { condition: { basic: ['=', '<>'] } },
      });
      await flushAll();

      const select = wrapper.findComponent(AdaptativeSelect);
      const optionValues = select.findAll('option').map((o) => o.element.value);
      expect(optionValues).toContain('=');
      expect(optionValues).toContain('<>');
      expect(optionValues).not.toContain('like');
      expect(optionValues).not.toContain('null');
    });

    it('shows single operator (no select) when allowedOperators has one option', async () => {
      const filter: ConditionFilter = reactive({
        type: 'condition',
        property: 'first_name',
        operator: '=',
        value: 'test',
        key: 23,
      });
      mountCondition(filter, {
        allowedOperators: { condition: { basic: ['='] } },
      });
      await flushAll();

      const select = wrapper.findComponent(AdaptativeSelect);
      // canEditOperator is false when only 1 option → select is disabled
      expect(select.props('disabled')).toBe(true);
    });
  });
});
