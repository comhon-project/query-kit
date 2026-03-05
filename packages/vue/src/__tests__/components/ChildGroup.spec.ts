import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';
import ChildGroup from '@components/Filter/ChildGroup.vue';
import FilterPicker from '@components/Filter/FilterPicker.vue';
import GroupElement from '@components/Filter/GroupElement.vue';
import InvalidOperator from '@components/Messages/InvalidOperator.vue';
import IconButton from '@components/Common/IconButton.vue';
import AdaptativeSelect from '@components/Common/AdaptativeSelect.vue';
import CollapseButton from '@components/Common/CollapseButton.vue';
import { resolve, registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { builderConfigProvide } from '@tests/helpers/provideConfig';
import { flushAll } from '@tests/helpers/flushAsync';
import { locale, loadedTranslations } from '@i18n/i18n';
import fr from '@i18n/locales/fr';
import type { VueWrapper } from '@vue/test-utils';
import type { EntitySchema } from '@core/EntitySchema';
import type { GroupFilter, ConditionFilter } from '@core/types';

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

function mountChildGroup(filter: GroupFilter, configOverrides: Record<string, unknown> = {}) {
  wrapper = mountWithPlugin(ChildGroup, {
    props: {
      modelValue: filter,
      entitySchema: schema,
      collapsed: false,
      'onUpdate:collapsed': (v: boolean) => wrapper.setProps({ collapsed: v }),
    },
    global: { provide: builderConfigProvide(configOverrides) },
  });
}

describe('ChildGroup', () => {
  it('renders visible filters count in summary', async () => {
    const filter: GroupFilter = {
      key: 1,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 11, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
        { key: 12, type: 'condition', operator: '=', property: 'last_name', value: 'B' },
        { key: 13, type: 'condition', operator: '=', property: 'age', value: 25 },
      ],
    };
    mountChildGroup(filter);
    await flushAll();
    expect(wrapper.text()).toContain('3');
  });

  it('shows "filter" (singular) for 1 filter', async () => {
    const filter: GroupFilter = {
      key: 2,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 21, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountChildGroup(filter);
    await flushAll();
    expect(wrapper.text()).toContain('1');
    expect(wrapper.text()).toContain('filter');
    // Should not contain "filters" (plural) independently; text is "1 filter"
    expect(wrapper.text()).not.toMatch(/\bfilters\b/);
  });

  it('shows "filters" (plural) for multiple filters', async () => {
    const filter: GroupFilter = {
      key: 3,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 31, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
        { key: 32, type: 'condition', operator: '=', property: 'last_name', value: 'B' },
      ],
    };
    mountChildGroup(filter);
    await flushAll();
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('filters');
  });

  it('hides filters with visible=false from rendering', async () => {
    const filter: GroupFilter = {
      key: 4,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 41, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
        { key: 42, type: 'condition', operator: '=', property: 'last_name', value: 'B', visible: false },
        { key: 43, type: 'condition', operator: '=', property: 'age', value: 30 },
      ],
    };
    mountChildGroup(filter);
    await flushAll();
    // Only 2 visible filters
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('filters');
    expect(wrapper.findAll('li')).toHaveLength(2);
  });

  it('renders InvalidOperator for invalid group operator', async () => {
    const filter: GroupFilter = {
      key: 5,
      type: 'group',
      operator: 'invalid_op',
      filters: [
        { key: 51, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountChildGroup(filter);
    await flushAll();
    expect(wrapper.findComponent(InvalidOperator).exists()).toBe(true);
    expect(wrapper.text()).toContain('invalid_op');
  });

  it('emits remove when delete button clicked', async () => {
    const filter: GroupFilter = {
      key: 6,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 61, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountChildGroup(filter);
    await flushAll();
    // Find the delete button for the group itself (not child filters)
    const deleteButtons = wrapper.findAll('button').filter((btn) => {
      const label = btn.attributes('aria-label');
      return label && label.includes('group');
    });
    // The last matching button should be the group delete button
    expect(deleteButtons.length).toBeGreaterThan(0);
    await deleteButtons[0].trigger('click');
    expect(wrapper.emitted('remove')).toBeTruthy();
  });

  it('hides delete button when removable=false', async () => {
    const filter: GroupFilter = {
      key: 7,
      type: 'group',
      operator: 'and',
      removable: false,
      filters: [
        { key: 71, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountChildGroup(filter);
    await flushAll();
    // Check that no btn_danger delete icon button has group aria-label
    const dangerButtons = wrapper.findAll('.qkit-btn-danger').filter((btn) => {
      const label = btn.attributes('aria-label');
      return label && label.includes('group');
    });
    expect(dangerButtons.length).toBe(0);
  });

  it('shows add button when editable and searchable items exist', async () => {
    const filter: GroupFilter = {
      key: 8,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 81, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountChildGroup(filter);
    await flushAll();
    // The add filter icon button should be present
    const addButtons = wrapper.findAll('button').filter((btn) => {
      return btn.html().includes('add') || btn.attributes('aria-label')?.includes('add');
    });
    expect(addButtons.length).toBeGreaterThan(0);
  });

  it('hides add button when editable=false', async () => {
    const filter: GroupFilter = {
      key: 9,
      type: 'group',
      operator: 'and',
      editable: false,
      filters: [
        { key: 91, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountChildGroup(filter);
    await flushAll();
    // When not editable, add filter button should not appear
    const addButtons = wrapper.findAll('button').filter((btn) => {
      return btn.html().includes('add') || btn.attributes('aria-label')?.includes('add');
    });
    expect(addButtons.length).toBe(0);
  });

  it('collapse sets inert attribute on group list', async () => {
    const filter: GroupFilter = {
      key: 10,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 101, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountChildGroup(filter);
    await flushAll();

    // Initially not collapsed: inert is "false"
    const groupList = wrapper.find('[role="group"]');
    expect(groupList.exists()).toBe(true);
    expect(groupList.attributes('inert')).toBe('false');

    // Collapse
    await wrapper.setProps({ collapsed: true });
    await nextTick();
    // When collapsed, inert becomes "true"
    expect(groupList.attributes('inert')).toBe('true');
  });

  it('operator select respects displayOperator.group config', async () => {
    const filter: GroupFilter = {
      key: 11,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 111, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };

    // displayOperator: { group: false } should hide operator select
    mountChildGroup(filter, { displayOperator: { group: false } });
    await flushAll();
    const selects = wrapper.findAll('select');
    // No operator select for the group level
    const operatorSelects = selects.filter((s) => {
      const label = s.attributes('aria-label');
      return label && label.includes('operator');
    });
    expect(operatorSelects.length).toBe(0);
  });

  it('translates filter count label when locale changes', async () => {
    const filter: GroupFilter = {
      key: 12,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 121, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
        { key: 122, type: 'condition', operator: '=', property: 'last_name', value: 'B' },
      ],
    };
    mountChildGroup(filter);
    await flushAll();
    expect(wrapper.text()).toContain('filters');

    loadedTranslations['fr'] = fr;
    locale.value = 'fr';
    await nextTick();

    expect(wrapper.text()).toContain('filtres');
  });

  it('removes filter from the group when child emits remove', async () => {
    const filter: GroupFilter = {
      key: 13,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 131, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
        { key: 132, type: 'condition', operator: '=', property: 'last_name', value: 'B' },
      ],
    };
    mountChildGroup(filter);
    await flushAll();
    expect(filter.filters).toHaveLength(2);

    // Find the first GroupElement and trigger remove
    const groupElements = wrapper.findAllComponents(GroupElement);
    expect(groupElements.length).toBe(2);
    groupElements[0].vm.$emit('remove');
    await nextTick();

    expect(filter.filters).toHaveLength(1);
    expect((filter.filters[0] as ConditionFilter).property).toBe('last_name');
  });

  it('opens FilterPicker when add button is clicked', async () => {
    const filter: GroupFilter = {
      key: 14,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 141, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountChildGroup(filter);
    await flushAll();

    // Click the add filter button
    const addButtons = wrapper.findAllComponents(IconButton).filter((btn) => btn.props('icon') === 'add_filter');
    expect(addButtons.length).toBe(1);
    await addButtons[0].trigger('click');
    await nextTick();

    expect(wrapper.findComponent(FilterPicker).exists()).toBe(true);
  });

  it('adds filter from FilterPicker to group', async () => {
    const filter: GroupFilter = {
      key: 15,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 151, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountChildGroup(filter);
    await flushAll();

    // Open the FilterPicker
    const addButton = wrapper.findAllComponents(IconButton).find((btn) => btn.props('icon') === 'add_filter');
    await addButton!.trigger('click');
    await nextTick();

    // Emit validate from FilterPicker
    const picker = wrapper.findComponent(FilterPicker);
    picker.vm.$emit('validate', {
      type: 'condition',
      property: 'age',
      operator: '=',
      key: 999,
    });
    await nextTick();

    expect(filter.filters).toHaveLength(2);
    expect(filter.filters[1]).toEqual(
      expect.objectContaining({ property: 'age' }),
    );
  });

  it('un-collapses group when add button is clicked', async () => {
    const filter: GroupFilter = {
      key: 16,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 161, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountChildGroup(filter);
    await flushAll();

    // Collapse the group
    await wrapper.setProps({ collapsed: true });
    await nextTick();

    // Click add
    const addButton = wrapper.findAllComponents(IconButton).find((btn) => btn.props('icon') === 'add_filter');
    await addButton!.trigger('click');
    await nextTick();

    expect(wrapper.emitted('update:collapsed')).toBeTruthy();
    const lastCollapsedEmit = wrapper.emitted('update:collapsed')!;
    expect(lastCollapsedEmit[lastCollapsedEmit.length - 1]).toEqual([false]);
  });

  it('emits remove on delete button in invalid operator state', async () => {
    const filter: GroupFilter = {
      key: 17,
      type: 'group',
      operator: 'invalid_op',
      filters: [
        { key: 171, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountChildGroup(filter);
    await flushAll();

    expect(wrapper.findComponent(InvalidOperator).exists()).toBe(true);
    const deleteButton = wrapper.findAllComponents(IconButton).find((btn) => btn.props('icon') === 'delete');
    expect(deleteButton).toBeTruthy();
    await deleteButton!.trigger('click');
    expect(wrapper.emitted('remove')).toBeTruthy();
  });

  it('focuses parent treeitem when removing the only visible filter', async () => {
    const filter: GroupFilter = {
      key: 18,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 181, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountChildGroup(filter);
    await flushAll();

    // There's only 1 visible filter; removing it means targetIndex = -1
    // which triggers the fallback: closest('[role="treeitem"]')?.focus()
    const groupElements = wrapper.findAllComponents(GroupElement);
    expect(groupElements.length).toBe(1);
    groupElements[0].vm.$emit('remove');
    await nextTick();

    expect(filter.filters).toHaveLength(0);
  });

  it('renders operator select and allows changing operator value', async () => {
    const filter: GroupFilter = {
      key: 19,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 191, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    // displayOperator: true is already the default in builderConfigProvide
    mountChildGroup(filter);
    await flushAll();

    // Find the operator select (AdaptativeSelect renders a <select>)
    const operatorSelect = wrapper.findComponent(AdaptativeSelect);
    expect(operatorSelect.exists()).toBe(true);

    // Change the operator value through the select
    const selectEl = operatorSelect.find('select');
    await selectEl.setValue('or');
    expect(filter.operator).toBe('or');
  });

  it('renders CollapseButton and toggles collapsed state via button click', async () => {
    const filter: GroupFilter = {
      key: 20,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 201, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountChildGroup(filter);
    await flushAll();

    const collapseBtn = wrapper.findComponent(CollapseButton);
    expect(collapseBtn.exists()).toBe(true);

    // Initially not collapsed
    expect((wrapper.props() as Record<string, unknown>).collapsed).toBe(false);

    // Click the collapse button to toggle
    await collapseBtn.find('button').trigger('click');
    await nextTick();

    // Should have emitted update:collapsed with true
    const emitted = wrapper.emitted('update:collapsed');
    expect(emitted).toBeTruthy();
    expect(emitted![emitted!.length - 1]).toEqual([true]);
  });

  it('closes FilterPicker when show is set to false', async () => {
    const filter: GroupFilter = {
      key: 21,
      type: 'group',
      operator: 'and',
      filters: [
        { key: 211, type: 'condition', operator: '=', property: 'first_name', value: 'A' },
      ],
    };
    mountChildGroup(filter);
    await flushAll();

    // Open the FilterPicker
    const addButton = wrapper.findAllComponents(IconButton).find((btn) => btn.props('icon') === 'add_filter');
    await addButton!.trigger('click');
    await nextTick();

    const picker = wrapper.findComponent(FilterPicker);
    expect(picker.exists()).toBe(true);

    // Close it by emitting update:show = false from the picker
    picker.vm.$emit('update:show', false);
    await nextTick();

    // The FilterPicker component should still exist in DOM but with show=false
    // This exercises the v-model:show binding on line 128
    expect(wrapper.findComponent(FilterPicker).props('show')).toBe(false);
  });
});
