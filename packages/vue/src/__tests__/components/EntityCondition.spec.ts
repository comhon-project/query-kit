import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { reactive } from 'vue';
import EntityCondition from '@components/Filter/EntityCondition.vue';
import EntityQueueElement from '@components/Filter/EntityQueueElement.vue';
import EntityAction from '@components/Filter/EntityAction.vue';
import Condition from '@components/Filter/Condition.vue';
import ChildGroup from '@components/Filter/ChildGroup.vue';
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

function mountEntityCondition(
  filter: EntityConditionFilter,
  configOverrides: Record<string, unknown> = {},
) {
  wrapper = mountWithPlugin(EntityCondition, {
    props: {
      modelValue: filter,
      entitySchema: schema,
    },
    global: { provide: builderConfigProvide(configOverrides) },
  });
}

describe('EntityCondition', () => {
  it('renders relationship queue with property label', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 1,
    });
    mountEntityCondition(filter);
    await flushAll();

    expect(wrapper.findComponent(EntityQueueElement).exists()).toBe(true);
    expect(wrapper.text()).toContain('the company');
  });

  it('renders EntityAction when no end filter', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 2,
    });
    mountEntityCondition(filter);
    await flushAll();

    expect(wrapper.findComponent(EntityAction).exists()).toBe(true);
  });

  it('renders end filter component when condition is present', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
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
    mountEntityCondition(filter);
    await flushAll();

    expect(wrapper.findComponent(Condition).exists()).toBe(true);
    expect(wrapper.text()).toContain('brand name');
  });

  it('shows InvalidProperty for unknown property', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'nonexistent_property',
      key: 4,
    });
    mountEntityCondition(filter);
    await flushAll();

    expect(wrapper.findComponent(InvalidProperty).exists()).toBe(true);
    expect(wrapper.text()).toContain('nonexistent_property');
  });

  it('shows InvalidOperator for invalid operator', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'invalid_op',
      property: 'company',
      key: 5,
    });
    mountEntityCondition(filter);
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

    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company', // related to 'organization' which won't resolve
      key: 6,
    });

    wrapper = mount(EntityCondition, {
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
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'invalid_op',
      property: 'company',
      key: 7,
    });
    mountEntityCondition(filter);
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
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 8,
    });
    mountEntityCondition(filter);
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
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      removable: false,
      key: 9,
    });
    mountEntityCondition(filter);
    await flushAll();

    // No delete button should be rendered
    const deleteButtons = wrapper.findAllComponents(IconButton).filter((btn) => {
      return btn.props('icon') === 'delete';
    });
    expect(deleteButtons.length).toBe(0);
  });

  it('renders queue elements in relationship slot of end filter', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
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
    mountEntityCondition(filter);
    await flushAll();

    // The Condition component should be rendered with a relationship slot
    // containing a EntityQueueElement
    const queueElements = wrapper.findAllComponents(EntityQueueElement);
    expect(queueElements.length).toBeGreaterThan(0);

    // The queue element should show the company label
    expect(queueElements[0].text()).toContain('the company');
  });

  it('removes end filter and shows EntityAction again', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 11,
      filter: {
        type: 'condition',
        operator: '=',
        property: 'brand_name',
        value: 'Test',
        key: 111,
      },
    });
    mountEntityCondition(filter);
    await flushAll();

    // Should show the Condition component
    expect(wrapper.findComponent(Condition).exists()).toBe(true);

    // Find the delete button on the condition (remove end filter)
    const condition = wrapper.findComponent(Condition);
    condition.vm.$emit('remove');
    await flushAll();

    // After removing the end filter, it should show EntityAction again
    expect(wrapper.findComponent(Condition).exists()).toBe(false);
    expect(wrapper.findComponent(EntityAction).exists()).toBe(true);
    expect(filter.filter).toBeUndefined();
  });

  it('handles chained relationship conditions (user -> company -> contacts)', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 12,
      filter: {
        type: 'entity_condition',
        operator: 'has',
        property: 'contacts',
        key: 121,
        filter: {
          type: 'condition',
          operator: '=',
          property: 'first_name',
          value: 'Alice',
          key: 1211,
        },
      },
    });
    mountEntityCondition(filter);
    await flushAll();

    // Should render multiple queue elements
    const queueElements = wrapper.findAllComponents(EntityQueueElement);
    expect(queueElements.length).toBe(2);
    // The end filter should be rendered
    expect(wrapper.findComponent(Condition).exists()).toBe(true);
  });

  it('adds a condition filter via EntityAction add event', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 13,
    });
    mountEntityCondition(filter);
    await flushAll();

    // Should show EntityAction (no end filter yet)
    const action = wrapper.findComponent(EntityAction);
    expect(action.exists()).toBe(true);

    // Emit 'add' with a condition filter
    action.vm.$emit('add', {
      type: 'condition',
      property: 'brand_name',
      operator: '=',
      value: 'Test',
      key: 131,
    });
    await flushAll();

    // After adding, the Condition component should be rendered
    expect(wrapper.findComponent(Condition).exists()).toBe(true);
    // The filter object should have been updated
    expect(filter.filter).toEqual(
      expect.objectContaining({
        type: 'condition',
        property: 'brand_name',
        operator: '=',
        value: 'Test',
      }),
    );
  });

  it('adds a chained entity_condition via EntityAction add event', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 14,
    });
    mountEntityCondition(filter);
    await flushAll();

    // Should show EntityAction (no end filter yet)
    const action = wrapper.findComponent(EntityAction);
    expect(action.exists()).toBe(true);

    // Emit 'add' with a entity_condition filter
    action.vm.$emit('add', {
      type: 'entity_condition',
      operator: 'has',
      property: 'contacts',
      key: 141,
    });
    await flushAll();

    // After adding a chained entity_condition, there should be 2 queue elements
    const queueElements = wrapper.findAllComponents(EntityQueueElement);
    expect(queueElements.length).toBe(2);
  });

  it('removes queue element and emits remove when last element removed', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 15,
    });
    mountEntityCondition(filter);
    await flushAll();

    // Should show EntityAction (no end filter)
    const action = wrapper.findComponent(EntityAction);
    expect(action.exists()).toBe(true);

    // Emit 'remove' from EntityAction, which triggers removeQueueFilter
    action.vm.$emit('remove');

    // Since there was only one queue element, removing it should emit 'remove'
    expect(wrapper.emitted('remove')).toBeTruthy();

    // Unmount immediately (like the parent would) to prevent template render error
    // when the queue becomes empty
    wrapper.unmount();
  });

  it('removes chained queue element and falls back to EntityAction', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 16,
    });
    mountEntityCondition(filter);
    await flushAll();

    // First, add a chained entity_condition
    const action = wrapper.findComponent(EntityAction);
    action.vm.$emit('add', {
      type: 'entity_condition',
      operator: 'has',
      property: 'contacts',
      key: 161,
    });
    await flushAll();

    // Now there should be 2 queue elements
    expect(wrapper.findAllComponents(EntityQueueElement).length).toBe(2);

    // Find the new EntityAction (at the end of the chain) and emit 'remove'
    const newAction = wrapper.findComponent(EntityAction);
    newAction.vm.$emit('remove');
    await flushAll();

    // After removing, should be back to 1 queue element with EntityAction
    expect(wrapper.findAllComponents(EntityQueueElement).length).toBe(1);
    expect(wrapper.findComponent(EntityAction).exists()).toBe(true);
    // The chained filter should have been removed
    expect(filter.filter).toBeUndefined();
  });

  it('renders Scope component when end filter is a scope', async () => {
    const Scope = (await import('@components/Filter/Scope.vue')).default;
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 18,
      filter: {
        type: 'scope',
        id: 'scope',
        parameters: [],
        key: 181,
      } as any,
    });
    mountEntityCondition(filter);
    await flushAll();

    expect(wrapper.findComponent(Scope).exists()).toBe(true);
  });

  it('passes collapsed model to end filter ChildGroup component', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'company',
      key: 17,
      filter: {
        type: 'group',
        operator: 'and',
        filters: [
          { type: 'condition', operator: '=', property: 'brand_name', value: 'Test', key: 171 },
        ],
      },
    });
    mountEntityCondition(filter);
    await flushAll();

    // ChildGroup accepts v-model:collapsed
    const childGroup = wrapper.findComponent(ChildGroup);
    expect(childGroup.exists()).toBe(true);
    expect(childGroup.props('collapsed')).toBe(false);
  });

  it('does not render EntityAction when object property has has_not operator', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has_not',
      property: 'metadata',
      key: 180,
    });
    mountEntityCondition(filter);
    await flushAll();

    expect(wrapper.findComponent(EntityAction).exists()).toBe(false);
  });

  it('removes child filter when object property operator changes to has_not', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'metadata',
      key: 181,
      filter: {
        type: 'condition',
        operator: '=',
        property: 'label',
        value: 'test',
        key: 182,
      },
    });
    mountEntityCondition(filter);
    await flushAll();

    expect(wrapper.findComponent(Condition).exists()).toBe(true);

    filter.operator = 'has_not';
    await flushAll();

    expect(filter.filter).toBeUndefined();
    expect(wrapper.findComponent(Condition).exists()).toBe(false);
    expect(wrapper.findComponent(EntityAction).exists()).toBe(false);
  });

  it('truncates queue when non-last object element operator changes to has_not', async () => {
    const filter: EntityConditionFilter = reactive({
      type: 'entity_condition',
      operator: 'has',
      property: 'metadata',
      key: 190,
      filter: {
        type: 'entity_condition',
        operator: 'has',
        property: 'address',
        key: 191,
        filter: {
          type: 'condition',
          operator: '=',
          property: 'city',
          value: 'Paris',
          key: 192,
        },
      },
    });
    mountEntityCondition(filter);
    await flushAll();

    // Should have 2 queue elements (metadata + address) and a Condition end filter
    expect(wrapper.findAllComponents(EntityQueueElement).length).toBe(2);
    expect(wrapper.findComponent(Condition).exists()).toBe(true);

    // Change first element (metadata) operator to has_not
    filter.operator = 'has_not';
    await flushAll();

    // Should truncate: only 1 queue element, no child filter
    expect(wrapper.findAllComponents(EntityQueueElement).length).toBe(1);
    expect(filter.filter).toBeUndefined();
    expect(wrapper.findComponent(Condition).exists()).toBe(false);
  });
});
