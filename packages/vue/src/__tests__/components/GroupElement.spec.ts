import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import GroupElement from '@components/Filter/GroupElement.vue';
import Condition from '@components/Filter/Condition.vue';
import ScopeComponent from '@components/Filter/Scope.vue';
import ChildGroup from '@components/Filter/ChildGroup.vue';
import RelationshipCondition from '@components/Filter/RelationshipCondition.vue';
import { resolve, registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { builderConfigProvide } from '@tests/helpers/provideConfig';
import { flushAll } from '@tests/helpers/flushAsync';
import type { VueWrapper } from '@vue/test-utils';
import type { EntitySchema } from '@core/EntitySchema';
import type { ConditionFilter, ScopeFilter, GroupFilter, RelationshipConditionFilter } from '@core/types';

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

function mountGroupElement(filter: any) {
  wrapper = mountWithPlugin(GroupElement, {
    props: {
      modelValue: filter,
      entitySchema: schema,
    },
    global: { provide: builderConfigProvide() },
  });
}

describe('GroupElement', () => {
  it('renders with role="treeitem" on li element', async () => {
    const filter: ConditionFilter = {
      key: 1,
      type: 'condition',
      operator: '=',
      property: 'first_name',
      value: 'John',
    };
    mountGroupElement(filter);
    await flushAll();
    const li = wrapper.find('li');
    expect(li.exists()).toBe(true);
    expect(li.attributes('role')).toBe('treeitem');
  });

  it('renders Condition component for condition filter type', async () => {
    const filter: ConditionFilter = {
      key: 2,
      type: 'condition',
      operator: '=',
      property: 'first_name',
      value: 'Alice',
    };
    mountGroupElement(filter);
    await flushAll();
    expect(wrapper.findComponent(Condition).exists()).toBe(true);
  });

  it('renders Scope component for scope filter type', async () => {
    const filter: ScopeFilter = {
      key: 3,
      type: 'scope',
      id: 'scope',
    };
    mountGroupElement(filter);
    await flushAll();
    expect(wrapper.findComponent(ScopeComponent).exists()).toBe(true);
  });

  it('renders ChildGroup component for group filter type', async () => {
    const filter: GroupFilter = {
      key: 4,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 41, type: 'condition', operator: '=', property: 'first_name', value: 'Bob' },
      ],
    };
    mountGroupElement(filter);
    await flushAll();
    expect(wrapper.findComponent(ChildGroup).exists()).toBe(true);
  });

  it('renders RelationshipCondition component for relationship_condition filter type', async () => {
    const filter: RelationshipConditionFilter = {
      key: 8,
      type: 'relationship_condition',
      operator: 'has',
      property: 'company',
    };
    mountGroupElement(filter);
    await flushAll();
    expect(wrapper.findComponent(RelationshipCondition).exists()).toBe(true);
  });

  it('sets aria-expanded for group filter (expandable)', async () => {
    const filter: GroupFilter = {
      key: 5,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 51, type: 'condition', operator: '=', property: 'first_name', value: 'Eve' },
      ],
    };
    mountGroupElement(filter);
    await flushAll();
    const li = wrapper.find('li');
    expect(li.attributes('aria-expanded')).toBe('true');
  });

  it('does not set aria-expanded for condition filter (not expandable)', async () => {
    const filter: ConditionFilter = {
      key: 6,
      type: 'condition',
      operator: '=',
      property: 'first_name',
      value: 'Test',
    };
    mountGroupElement(filter);
    await flushAll();
    const li = wrapper.find('li');
    expect(li.attributes('aria-expanded')).toBeUndefined();
  });

  it('emits remove with filter key when child emits remove', async () => {
    const filter: ConditionFilter = {
      key: 7,
      type: 'condition',
      operator: '=',
      property: 'first_name',
      value: 'Test',
    };
    mountGroupElement(filter);
    await flushAll();
    const condition = wrapper.findComponent(Condition);
    condition.vm.$emit('remove');
    expect(wrapper.emitted('remove')).toBeTruthy();
    expect(wrapper.emitted('remove')![0]).toEqual([7]);
  });

  it('sets aria-expanded for relationship_condition with nested group', async () => {
    const filter: RelationshipConditionFilter = {
      key: 9,
      type: 'relationship_condition',
      operator: 'has',
      property: 'company',
      filter: {
        key: 91,
        type: 'group',
        operator: 'and',
        filters: [
          { key: 911, type: 'condition', operator: '=', property: 'brand_name', value: 'Acme' },
        ],
      },
    };
    mountGroupElement(filter);
    await flushAll();
    const li = wrapper.find('li');
    expect(li.attributes('aria-expanded')).toBe('true');
  });

  it('does not set aria-expanded for relationship_condition without filter', async () => {
    const filter: RelationshipConditionFilter = {
      key: 10,
      type: 'relationship_condition',
      operator: 'has',
      property: 'company',
    };
    mountGroupElement(filter);
    await flushAll();
    const li = wrapper.find('li');
    expect(li.attributes('aria-expanded')).toBeUndefined();
  });

  it('toggles collapse via tree-toggle custom event on expandable group', async () => {
    const filter: GroupFilter = {
      key: 12,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 121, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountGroupElement(filter);
    await flushAll();

    const li = wrapper.find('li');
    expect(li.attributes('aria-expanded')).toBe('true');

    // Dispatch tree-toggle to trigger toggleCollapse
    li.element.dispatchEvent(new CustomEvent('tree-toggle', { bubbles: false }));
    await flushAll();

    expect(li.attributes('aria-expanded')).toBe('false');
  });

  it('throws error for invalid filter type', () => {
    expect(() => {
      mountGroupElement({
        key: 13,
        type: 'invalid_type' as any,
        property: 'x',
      });
    }).toThrow('invalid type invalid_type');
  });

  it('sets aria-expanded for relationship_condition with nested condition (not expandable)', async () => {
    const filter: RelationshipConditionFilter = {
      key: 11,
      type: 'relationship_condition',
      operator: 'has',
      property: 'company',
      filter: {
        key: 111,
        type: 'condition',
        operator: '=',
        property: 'brand_name',
        value: 'Test',
      },
    };
    mountGroupElement(filter);
    await flushAll();
    const li = wrapper.find('li');
    // A relationship_condition with a condition child is NOT expandable (condition has no children)
    expect(li.attributes('aria-expanded')).toBeUndefined();
  });
});
