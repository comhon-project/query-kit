import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { reactive } from 'vue';
import EntityAction from '@components/Filter/EntityAction.vue';
import FilterPicker from '@components/Filter/FilterPicker.vue';
import IconButton from '@components/Common/IconButton.vue';
import {
  resolve,
  registerLoader,
  registerTranslationsLoader,
} from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { builderConfigProvide } from '@tests/helpers/provideConfig';
import { flushAll } from '@tests/helpers/flushAsync';
import type { VueWrapper } from '@vue/test-utils';
import type { EntitySchema } from '@core/EntitySchema';
import type { EntityConditionFilter } from '@core/types';

let wrapper: VueWrapper;
let orgSchema: EntitySchema;

beforeEach(async () => {
  registerLoader(entitySchemaLoader);
  registerTranslationsLoader(entityTranslationsLoader);
  registerRequestLoader(requestSchemaLoader);
  orgSchema = await resolve('organization');
});

afterEach(() => {
  wrapper?.unmount();
});

function mountAction(
  filter: EntityConditionFilter,
  configOverrides: Record<string, unknown> = {},
  entitySchema: EntitySchema = orgSchema,
) {
  wrapper = mountWithPlugin(EntityAction, {
    props: {
      modelValue: filter,
      entitySchema,
    },
    global: { provide: builderConfigProvide(configOverrides) },
  });
}

describe('EntityAction', () => {
  it('shows add button when searchable items exist and editable', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 1,
    });
    mountAction(filter);
    await flushAll();

    // Organization has filtrable properties: ['brand_name']
    const addButtons = wrapper.findAllComponents(IconButton).filter((btn) => {
      return btn.props('icon') === 'add_filter';
    });
    expect(addButtons.length).toBe(1);
  });

  it('hides add button when editable=false', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      editable: false,
      key: 2,
    });
    mountAction(filter);
    await flushAll();

    const addButtons = wrapper.findAllComponents(IconButton).filter((btn) => {
      return btn.props('icon') === 'add_filter';
    });
    expect(addButtons.length).toBe(0);
  });

  it('hides add button when no searchable items', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 3,
    });
    // Use allowedProperties and allowedScopes to restrict organization to nothing
    mountAction(filter, { allowedProperties: { organization: [] }, allowedScopes: { organization: [] } });
    await flushAll();

    const addButtons = wrapper.findAllComponents(IconButton).filter((btn) => {
      return btn.props('icon') === 'add_filter';
    });
    expect(addButtons.length).toBe(0);
  });

  it('opens FilterPicker on add button click', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 4,
    });
    mountAction(filter);
    await flushAll();

    const filterPicker = wrapper.findComponent(FilterPicker);
    expect(filterPicker.props('show')).toBe(false);

    const addButton = wrapper.findAllComponents(IconButton).find((btn) => {
      return btn.props('icon') === 'add_filter';
    });
    await addButton!.trigger('click');
    await flushAll();

    expect(wrapper.findComponent(FilterPicker).props('show')).toBe(true);
  });

  it('emits add with filter from FilterPicker', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 5,
    });
    mountAction(filter);
    await flushAll();

    const filterPicker = wrapper.findComponent(FilterPicker);
    const newFilter = {
      type: 'condition' as const,
      operator: '=',
      property: 'brand_name',
      key: 99,
    };
    filterPicker.vm.$emit('validate', newFilter);
    await flushAll();

    const addEvents = wrapper.emitted('add');
    expect(addEvents).toBeTruthy();
    expect(addEvents![0][0]).toEqual(newFilter);
  });
});
