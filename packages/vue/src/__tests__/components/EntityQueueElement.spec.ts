import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { reactive } from 'vue';
import EntityQueueElement from '@components/Filter/EntityQueueElement.vue';
import AdaptativeSelect from '@components/Common/AdaptativeSelect.vue';
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
import type { EntityConditionFilter } from '@core/types';

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

function mountQueueElement(filter: EntityConditionFilter, configOverrides: Record<string, unknown> = {}) {
  wrapper = mountWithPlugin(EntityQueueElement, {
    props: {
      modelValue: filter,
      entitySchema: schema,
    },
    global: { provide: builderConfigProvide(configOverrides) },
  });
}

describe('EntityQueueElement', () => {
  it('renders property label', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 1,
    });
    mountQueueElement(filter);
    await flushAll();

    expect(wrapper.text()).toContain('the company');
  });

  it('renders operator select when displayOperator=true', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 2,
    });
    mountQueueElement(filter, { displayOperator: true });
    await flushAll();

    expect(wrapper.findComponent(AdaptativeSelect).exists()).toBe(true);
  });

  it('hides operator select when displayOperator=false', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 3,
    });
    mountQueueElement(filter, { displayOperator: false });
    await flushAll();

    expect(wrapper.findComponent(AdaptativeSelect).exists()).toBe(false);
  });

  it('hides operator select when displayOperator={entity_condition: false}', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 4,
    });
    mountQueueElement(filter, { displayOperator: { entity_condition: false } });
    await flushAll();

    expect(wrapper.findComponent(AdaptativeSelect).exists()).toBe(false);
  });

  it('renders as li element', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 5,
    });
    mountQueueElement(filter);
    await flushAll();

    expect(wrapper.find('li').exists()).toBe(true);
  });

  it('updates property label when locale changes', async () => {
    await loadRawTranslations('user', 'fr');

    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 6,
    });
    mountQueueElement(filter);
    await flushAll();

    expect(wrapper.text()).toContain('the company');

    locale.value = 'fr';
    await flushAll();

    expect(wrapper.text()).toContain('companie');
  });

  it('updates operator label when locale changes', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 7,
    });
    mountQueueElement(filter, { displayOperator: true });
    await flushAll();

    const select = wrapper.findComponent(AdaptativeSelect);
    const hasOption = select.findAll('option').find((o) => o.element.value === 'has');
    expect(hasOption?.text()).toBe('has');

    locale.value = 'fr';
    await flushAll();

    const updatedOption = select.findAll('option').find((o) => o.element.value === 'has');
    expect(updatedOption?.text()).toBe('a');
  });
});
