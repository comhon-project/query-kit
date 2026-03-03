import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { reactive } from 'vue';
import RelationshipCondition from '@components/Filter/RelationshipCondition.vue';
import RelationshipQueueElement from '@components/Filter/RelationshipQueueElement.vue';
import RelationshipAction from '@components/Filter/RelationshipAction.vue';
import Condition from '@components/Filter/Condition.vue';
import InvalidProperty from '@components/Messages/InvalidProperty.vue';
import InvalidOperator from '@components/Messages/InvalidOperator.vue';
import InvalidEntity from '@components/Messages/InvalidEntity.vue';
import IconButton from '@components/Common/IconButton.vue';
import plugin from '@core/Plugin';
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
import type { RelationshipConditionFilter } from '@core/types';

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

function mountRelationshipCondition(
  filter: RelationshipConditionFilter,
  configOverrides: Record<string, unknown> = {},
) {
  wrapper = mountWithPlugin(RelationshipCondition, {
    props: {
      modelValue: filter,
      entitySchema: schema,
    },
    global: { provide: builderConfigProvide(configOverrides) },
  });
}

describe('RelationshipCondition', () => {
  it('renders relationship queue with property label', async () => {
    const filter: RelationshipConditionFilter = reactive({
      type: 'relationship_condition',
      operator: 'has',
      property: 'company',
      key: 1,
    });
    mountRelationshipCondition(filter);
    await flushAll();

    expect(wrapper.findComponent(RelationshipQueueElement).exists()).toBe(true);
    expect(wrapper.text()).toContain('the company');
  });

  it('renders RelationshipAction when no end filter', async () => {
    const filter: RelationshipConditionFilter = reactive({
      type: 'relationship_condition',
      operator: 'has',
      property: 'company',
      key: 2,
    });
    mountRelationshipCondition(filter);
    await flushAll();

    expect(wrapper.findComponent(RelationshipAction).exists()).toBe(true);
  });

  it('renders end filter component when condition is present', async () => {
    const filter: RelationshipConditionFilter = reactive({
      type: 'relationship_condition',
      operator: 'has',
      property: 'company',
      key: 3,
      filter: {
        type: 'condition',
        operator: '=',
        property: 'brand_name',
        value: 'Acme',
        key: 31,
      },
    });
    mountRelationshipCondition(filter);
    await flushAll();

    expect(wrapper.findComponent(Condition).exists()).toBe(true);
    expect(wrapper.text()).toContain('brand name');
  });

  it('shows InvalidProperty for unknown property', async () => {
    const filter: RelationshipConditionFilter = reactive({
      type: 'relationship_condition',
      operator: 'has',
      property: 'nonexistent_property',
      key: 4,
    });
    mountRelationshipCondition(filter);
    await flushAll();

    expect(wrapper.findComponent(InvalidProperty).exists()).toBe(true);
    expect(wrapper.text()).toContain('nonexistent_property');
  });

  it('shows InvalidOperator for invalid operator', async () => {
    const filter: RelationshipConditionFilter = reactive({
      type: 'relationship_condition',
      operator: 'invalid_op',
      property: 'company',
      key: 5,
    });
    mountRelationshipCondition(filter);
    await flushAll();

    expect(wrapper.findComponent(InvalidOperator).exists()).toBe(true);
    expect(wrapper.text()).toContain('invalid_op');
  });

  it('shows InvalidEntity for unknown related entity', async () => {
    // Use a custom loader that only knows 'user', not 'organization'
    const userOnlyLoader = {
      load: async (name: string) => {
        if (name === 'user') return entitySchemaLoader.load(name);
        return null;
      },
    };

    // Install the plugin with the custom loader that cannot resolve 'organization'
    registerLoader(userOnlyLoader);
    registerTranslationsLoader(entityTranslationsLoader);
    registerRequestLoader(requestSchemaLoader);
    schema = await resolve('user');

    const filter: RelationshipConditionFilter = reactive({
      type: 'relationship_condition',
      operator: 'has',
      property: 'company', // related to 'organization' which won't resolve
      key: 6,
    });

    wrapper = mount(RelationshipCondition, {
      props: {
        modelValue: filter,
        entitySchema: schema,
      },
      global: {
        plugins: [[plugin, {
          entitySchemaLoader: userOnlyLoader,
          entityTranslationsLoader,
          icons: 'default' as const,
        }]],
        provide: builderConfigProvide(),
      },
    });
    await flushAll();

    expect(wrapper.findComponent(InvalidEntity).exists()).toBe(true);
  });

  it('emits remove when delete clicked on invalid state', async () => {
    const filter: RelationshipConditionFilter = reactive({
      type: 'relationship_condition',
      operator: 'invalid_op',
      property: 'company',
      key: 7,
    });
    mountRelationshipCondition(filter);
    await flushAll();

    // In invalid state, there's a delete IconButton
    const deleteButton = wrapper.findAllComponents(IconButton).find((btn) => {
      return btn.props('icon') === 'delete';
    });
    expect(deleteButton).toBeDefined();
    await deleteButton!.trigger('click');
    expect(wrapper.emitted('remove')).toBeTruthy();
  });

  it('emits remove when delete clicked on relationship container (no end filter)', async () => {
    const filter: RelationshipConditionFilter = reactive({
      type: 'relationship_condition',
      operator: 'has',
      property: 'company',
      key: 8,
    });
    mountRelationshipCondition(filter);
    await flushAll();

    // In the relationship_container state (no endQueueFilter), there's a delete IconButton
    const deleteButton = wrapper.findAllComponents(IconButton).find((btn) => {
      return btn.props('icon') === 'delete';
    });
    expect(deleteButton).toBeDefined();
    await deleteButton!.trigger('click');
    expect(wrapper.emitted('remove')).toBeTruthy();
  });

  it('hides delete button when removable=false', async () => {
    const filter: RelationshipConditionFilter = reactive({
      type: 'relationship_condition',
      operator: 'has',
      property: 'company',
      removable: false,
      key: 9,
    });
    mountRelationshipCondition(filter);
    await flushAll();

    // No delete button should be rendered
    const deleteButtons = wrapper.findAllComponents(IconButton).filter((btn) => {
      return btn.props('icon') === 'delete';
    });
    expect(deleteButtons.length).toBe(0);
  });

  it('renders queue elements in relationship slot of end filter', async () => {
    const filter: RelationshipConditionFilter = reactive({
      type: 'relationship_condition',
      operator: 'has',
      property: 'company',
      key: 10,
      filter: {
        type: 'condition',
        operator: '=',
        property: 'brand_name',
        value: 'Test',
        key: 101,
      },
    });
    mountRelationshipCondition(filter);
    await flushAll();

    // The Condition component should be rendered with a relationship slot
    // containing a RelationshipQueueElement
    const queueElements = wrapper.findAllComponents(RelationshipQueueElement);
    expect(queueElements.length).toBeGreaterThan(0);

    // The queue element should show the company label
    expect(queueElements[0].text()).toContain('the company');
  });
});
