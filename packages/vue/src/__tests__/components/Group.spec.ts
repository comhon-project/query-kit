import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Group from '@components/Filter/Group.vue';
import ChildGroup from '@components/Filter/ChildGroup.vue';
import { resolve, registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { builderConfigProvide } from '@tests/helpers/provideConfig';
import { flushAll } from '@tests/helpers/flushAsync';
import type { VueWrapper } from '@vue/test-utils';
import type { EntitySchema } from '@core/EntitySchema';
import type { GroupFilter } from '@core/types';

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

function mountGroup(filter: GroupFilter) {
  wrapper = mountWithPlugin(Group, {
    props: {
      modelValue: filter,
      entitySchema: schema,
    },
    global: { provide: builderConfigProvide() },
  });
}

describe('Group', () => {
  it('renders with role="tree" wrapper', async () => {
    const filter: GroupFilter = {
      key: 1,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 11, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountGroup(filter);
    await flushAll();
    const tree = wrapper.find('[role="tree"]');
    expect(tree.exists()).toBe(true);
  });

  it('contains a role="treeitem" child', async () => {
    const filter: GroupFilter = {
      key: 2,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 21, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountGroup(filter);
    await flushAll();
    const treeitem = wrapper.find('[role="treeitem"]');
    expect(treeitem.exists()).toBe(true);
  });

  it('renders ChildGroup inside', async () => {
    const filter: GroupFilter = {
      key: 3,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 31, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountGroup(filter);
    await flushAll();
    expect(wrapper.findComponent(ChildGroup).exists()).toBe(true);
  });

  it('emits exit on Escape key', async () => {
    const filter: GroupFilter = {
      key: 4,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 41, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountGroup(filter);
    await flushAll();

    // Focus the top-level treeitem so Escape triggers exit
    const treeitem = wrapper.find('[role="tree"] > [role="treeitem"]');
    await treeitem.trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('exit')).toBeTruthy();
  });

  it('toggles collapse via tree-toggle custom event on treeitem', async () => {
    const filter: GroupFilter = {
      key: 6,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 61, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountGroup(filter);
    await flushAll();

    const treeitem = wrapper.find('[role="tree"] > [role="treeitem"]');
    // Initially expanded (collapsed=false → aria-expanded=true)
    expect(treeitem.attributes('aria-expanded')).toBe('true');

    // Dispatch tree-toggle custom event to trigger toggleCollapse
    treeitem.element.dispatchEvent(new CustomEvent('tree-toggle', { bubbles: false }));
    await flushAll();

    // Should now be collapsed
    expect(treeitem.attributes('aria-expanded')).toBe('false');

    // Toggle again to expand
    treeitem.element.dispatchEvent(new CustomEvent('tree-toggle', { bubbles: false }));
    await flushAll();
    expect(treeitem.attributes('aria-expanded')).toBe('true');
  });

  it('initializes tabindex on mount (first treeitem gets tabindex=0)', async () => {
    const filter: GroupFilter = {
      key: 5,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 51, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
        { key: 52, type: 'condition', operator: '=', property: 'last_name', value: 'B' },
      ],
    };
    mountGroup(filter);
    await flushAll();

    const treeitems = wrapper.findAll('[role="treeitem"]');
    expect(treeitems.length).toBeGreaterThan(0);
    // The first treeitem should have tabindex="0"
    expect(treeitems[0].attributes('tabindex')).toBe('0');
  });
});
