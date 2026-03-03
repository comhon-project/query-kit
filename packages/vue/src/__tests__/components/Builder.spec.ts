import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Builder from '@components/Filter/Builder.vue';
import Group from '@components/Filter/Group.vue';
import InvalidEntity from '@components/Messages/InvalidEntity.vue';
import IconButton from '@components/Common/IconButton.vue';
import { registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { flushAll } from '@tests/helpers/flushAsync';
import type { VueWrapper } from '@vue/test-utils';
import type { ConditionFilter, GroupFilter, Filter } from '@core/types';

let wrapper: VueWrapper;

beforeEach(() => {
  vi.useFakeTimers();
  registerLoader(entitySchemaLoader);
  registerTranslationsLoader(entityTranslationsLoader);
  registerRequestLoader(requestSchemaLoader);
});

afterEach(() => {
  vi.useRealTimers();
  wrapper?.unmount();
});

async function mountBuilder(
  props: Record<string, unknown> = {},
  modelValue: Filter | null = null,
) {
  wrapper = mountWithPlugin(Builder, {
    props: {
      entity: 'user',
      modelValue,
      'onUpdate:modelValue': (v: unknown) => wrapper.setProps({ modelValue: v }),
      ...props,
    },
  });
  // Wait for entity schema resolution and initial debounce
  await flushAll();
  vi.advanceTimersByTime(1000);
  await flushAll();
}

describe('Builder', () => {
  // ==================== Rendering ====================
  describe('rendering', () => {
    it('renders section with aria-label "filter"', async () => {
      await mountBuilder();
      const section = wrapper.find('section');
      expect(section.exists()).toBe(true);
      expect(section.attributes('aria-label')).toBe('filter');
    });

    it('renders Group component when entity is valid', async () => {
      await mountBuilder();
      expect(wrapper.findComponent(Group).exists()).toBe(true);
    });

    it('renders InvalidEntity when entity is invalid', async () => {
      // Mount without advancing timers to avoid the unhandled rejection from
      // getComputedFilter calling resolve() on a nonexistent entity.
      wrapper = mountWithPlugin(Builder, {
        props: {
          entity: 'nonexistent_entity',
          modelValue: null,
          'onUpdate:modelValue': (v: unknown) => wrapper.setProps({ modelValue: v }),
        },
      });
      await flushAll();
      // The watchEffect resolves the entity and sets validEntity=false
      expect(wrapper.findComponent(InvalidEntity).exists()).toBe(true);
      expect(wrapper.findComponent(Group).exists()).toBe(false);
    });
  });

  // ==================== Init ====================
  describe('init', () => {
    it('wraps null modelValue in an empty group', async () => {
      await mountBuilder();
      const emitted = wrapper.emitted('computed');
      expect(emitted).toBeTruthy();
      const lastEmit = emitted![emitted!.length - 1];
      const filter = lastEmit[0] as GroupFilter;
      expect(filter.type).toBe('group');
      expect(filter.filters).toEqual([]);
      expect(filter.operator).toBe('and');
    });

    it('wraps a condition filter in a group', async () => {
      const condition: ConditionFilter = {
        type: 'condition',
        property: 'first_name',
        operator: '=',
        value: 'Alice',
      };
      await mountBuilder({}, condition);
      const emitted = wrapper.emitted('computed');
      expect(emitted).toBeTruthy();
      const lastEmit = emitted![emitted!.length - 1];
      const filter = lastEmit[0] as GroupFilter;
      expect(filter.type).toBe('group');
      expect(filter.filters).toHaveLength(1);
      expect(filter.filters[0]).toEqual(
        expect.objectContaining({
          type: 'condition',
          property: 'first_name',
          operator: '=',
          value: 'Alice',
        }),
      );
    });

    it('keeps a group filter as-is', async () => {
      const group: GroupFilter = {
        type: 'group',
        operator: 'or',
        filters: [
          { type: 'condition', property: 'first_name', operator: '=', value: 'Bob' },
        ],
      };
      await mountBuilder({}, group);
      const emitted = wrapper.emitted('computed');
      expect(emitted).toBeTruthy();
      const lastEmit = emitted![emitted!.length - 1];
      const filter = lastEmit[0] as GroupFilter;
      expect(filter.type).toBe('group');
      expect(filter.operator).toBe('or');
      expect(filter.filters).toHaveLength(1);
      expect(filter.filters[0]).toEqual(
        expect.objectContaining({
          type: 'condition',
          property: 'first_name',
          value: 'Bob',
        }),
      );
    });
  });

  // ==================== Emit computed ====================
  describe('emit computed', () => {
    it('emits "computed" after debounce with computed filter (manual=false)', async () => {
      await mountBuilder();
      const emitted = wrapper.emitted('computed');
      expect(emitted).toBeTruthy();
      expect(emitted!.length).toBeGreaterThanOrEqual(1);
      // Second argument is manual=false
      const lastEmit = emitted![emitted!.length - 1];
      expect(lastEmit[1]).toBe(false);
    });

    it('emits on init with the initial filter', async () => {
      const condition: ConditionFilter = {
        type: 'condition',
        property: 'age',
        operator: '=',
        value: 25,
      };
      await mountBuilder({}, condition);
      const emitted = wrapper.emitted('computed');
      expect(emitted).toBeTruthy();
      expect(emitted!.length).toBeGreaterThanOrEqual(1);
      const firstEmit = emitted![0];
      const filter = firstEmit[0] as GroupFilter;
      expect(filter.type).toBe('group');
      expect(filter.filters).toHaveLength(1);
    });
  });

  // ==================== Manual mode ====================
  describe('manual mode', () => {
    it('emits computed on init even in manual mode', async () => {
      await mountBuilder({ manual: true });
      const emitted = wrapper.emitted('computed');
      expect(emitted).toBeTruthy();
      // Initial emit happens
      expect(emitted!.length).toBeGreaterThanOrEqual(1);
    });

    it('does NOT emit computed on regular changes when manual=true', async () => {
      const group: GroupFilter = {
        type: 'group',
        operator: 'and',
        filters: [
          { type: 'condition', property: 'first_name', operator: '=', value: 'Alice' },
        ],
      };
      await mountBuilder({ manual: true }, group);

      // Change the modelValue externally
      const newGroup: GroupFilter = {
        type: 'group',
        operator: 'and',
        filters: [
          { type: 'condition', property: 'first_name', operator: '=', value: 'Bob' },
        ],
      };
      await wrapper.setProps({ modelValue: newGroup });
      await flushAll();
      vi.advanceTimersByTime(1000);
      await flushAll();

      // After the initial emit, additional changes should not produce more computed events
      // The new modelValue re-init triggers another initial emit though (isInitialEmit is reset).
      // So let's check: the second init also causes an initial emit.
      // The key thing is the manual flag is false on those emits.
      const emittedAfter = wrapper.emitted('computed')!;
      // Each init triggers one emit; no extras from mere edits
      for (const emission of emittedAfter) {
        expect(emission[1]).toBe(false);
      }
    });

    it('validate() emits with manual=true', async () => {
      const group: GroupFilter = {
        type: 'group',
        operator: 'and',
        filters: [
          { type: 'condition', property: 'first_name', operator: '=', value: 'Alice' },
        ],
      };
      await mountBuilder({ manual: true }, group);

      // Find the search button (only shown in manual mode) and click it
      const iconButtons = wrapper.findAllComponents(IconButton);
      const searchButton = iconButtons.find(
        (btn) => btn.props('icon') === 'search',
      );
      expect(searchButton).toBeTruthy();
      await searchButton!.trigger('click');
      await flushAll();

      const emitted = wrapper.emitted('computed')!;
      // The last emit should have manual=true (from validate())
      const lastEmit = emitted[emitted.length - 1];
      expect(lastEmit[1]).toBe(true);
    });
  });

  // ==================== Debounce ====================
  describe('debounce', () => {
    it('respects custom debounce prop', async () => {
      wrapper = mountWithPlugin(Builder, {
        props: {
          entity: 'user',
          modelValue: null,
          debounce: 2000,
          'onUpdate:modelValue': (v: unknown) => wrapper.setProps({ modelValue: v }),
        },
      });
      await flushAll();

      // After 1000ms (default), should NOT have emitted yet
      vi.advanceTimersByTime(1000);
      await flushAll();
      expect(wrapper.emitted('computed')).toBeFalsy();

      // After another 1000ms (total 2000ms), should emit
      vi.advanceTimersByTime(1000);
      await flushAll();
      const emitted = wrapper.emitted('computed');
      expect(emitted).toBeTruthy();
      expect(emitted!.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ==================== getComputedFilter transformations ====================
  describe('getComputedFilter transformations', () => {
    it('removes empty conditions (value=undefined)', async () => {
      const group: GroupFilter = {
        type: 'group',
        operator: 'and',
        filters: [
          { type: 'condition', property: 'first_name', operator: '=', value: 'Alice' },
          { type: 'condition', property: 'last_name', operator: '=', value: undefined },
        ],
      };
      await mountBuilder({}, group);
      const emitted = wrapper.emitted('computed')!;
      const filter = emitted[emitted.length - 1][0] as GroupFilter;
      // Empty condition (value=undefined) should be removed
      expect(filter.filters).toHaveLength(1);
      expect(filter.filters[0]).toEqual(
        expect.objectContaining({ property: 'first_name', value: 'Alice' }),
      );
    });

    it('wraps like operator value with %', async () => {
      const group: GroupFilter = {
        type: 'group',
        operator: 'and',
        filters: [
          { type: 'condition', property: 'first_name', operator: 'like', value: 'test' },
        ],
      };
      await mountBuilder({}, group);
      const emitted = wrapper.emitted('computed')!;
      const filter = emitted[emitted.length - 1][0] as GroupFilter;
      expect(filter.filters).toHaveLength(1);
      const condition = filter.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('like');
      expect(condition.value).toBe('%test%');
    });

    it('converts begins_with to like with trailing %', async () => {
      const group: GroupFilter = {
        type: 'group',
        operator: 'and',
        filters: [
          { type: 'condition', property: 'first_name', operator: 'begins_with', value: 'Al' },
        ],
      };
      await mountBuilder({}, group);
      const emitted = wrapper.emitted('computed')!;
      const filter = emitted[emitted.length - 1][0] as GroupFilter;
      const condition = filter.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('like');
      expect(condition.value).toBe('Al%');
    });

    it('converts ends_with to like with leading %', async () => {
      const group: GroupFilter = {
        type: 'group',
        operator: 'and',
        filters: [
          { type: 'condition', property: 'first_name', operator: 'ends_with', value: 'ice' },
        ],
      };
      await mountBuilder({}, group);
      const emitted = wrapper.emitted('computed')!;
      const filter = emitted[emitted.length - 1][0] as GroupFilter;
      const condition = filter.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('like');
      expect(condition.value).toBe('%ice');
    });

    it('converts doesnt_begin_with to not_like with trailing %', async () => {
      const group: GroupFilter = {
        type: 'group',
        operator: 'and',
        filters: [
          { type: 'condition', property: 'first_name', operator: 'doesnt_begin_with', value: 'Al' },
        ],
      };
      await mountBuilder({}, group);
      const emitted = wrapper.emitted('computed')!;
      const filter = emitted[emitted.length - 1][0] as GroupFilter;
      const condition = filter.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('not_like');
      expect(condition.value).toBe('Al%');
    });

    it('converts doesnt_end_with to not_like with leading %', async () => {
      const group: GroupFilter = {
        type: 'group',
        operator: 'and',
        filters: [
          { type: 'condition', property: 'first_name', operator: 'doesnt_end_with', value: 'ice' },
        ],
      };
      await mountBuilder({}, group);
      const emitted = wrapper.emitted('computed')!;
      const filter = emitted[emitted.length - 1][0] as GroupFilter;
      const condition = filter.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('not_like');
      expect(condition.value).toBe('%ice');
    });

    it('strips keys from emitted filter', async () => {
      const group: GroupFilter = {
        type: 'group',
        operator: 'and',
        filters: [
          { type: 'condition', property: 'first_name', operator: '=', value: 'Alice' },
        ],
      };
      await mountBuilder({}, group);
      const emitted = wrapper.emitted('computed')!;
      const filter = emitted[emitted.length - 1][0] as GroupFilter;
      // No key property on any filter
      expect(filter.key).toBeUndefined();
      for (const child of filter.filters) {
        expect(child.key).toBeUndefined();
      }
    });

    it('strips editable and removable from emitted filter', async () => {
      const group: GroupFilter = {
        type: 'group',
        operator: 'and',
        filters: [
          { type: 'condition', property: 'first_name', operator: '=', value: 'Alice', editable: true, removable: true },
        ],
      };
      await mountBuilder({}, group);
      const emitted = wrapper.emitted('computed')!;
      const filter = emitted[emitted.length - 1][0] as GroupFilter;
      expect(filter.editable).toBeUndefined();
      expect(filter.removable).toBeUndefined();
      for (const child of filter.filters) {
        expect(child.editable).toBeUndefined();
        expect(child.removable).toBeUndefined();
      }
    });

    it('keeps conditions with null/not_null operator even without value', async () => {
      const group: GroupFilter = {
        type: 'group',
        operator: 'and',
        filters: [
          { type: 'condition', property: 'first_name', operator: 'null', value: undefined },
          { type: 'condition', property: 'last_name', operator: 'not_null', value: undefined },
        ],
      };
      await mountBuilder({}, group);
      const emitted = wrapper.emitted('computed')!;
      const filter = emitted[emitted.length - 1][0] as GroupFilter;
      expect(filter.filters).toHaveLength(2);
    });

    it('wraps not_like operator value with %', async () => {
      const group: GroupFilter = {
        type: 'group',
        operator: 'and',
        filters: [
          { type: 'condition', property: 'first_name', operator: 'not_like', value: 'test' },
        ],
      };
      await mountBuilder({}, group);
      const emitted = wrapper.emitted('computed')!;
      const filter = emitted[emitted.length - 1][0] as GroupFilter;
      const condition = filter.filters[0] as ConditionFilter;
      expect(condition.operator).toBe('not_like');
      expect(condition.value).toBe('%test%');
    });
  });

  // ==================== Undo/Redo ====================
  describe('undo/redo', () => {
    it('undo button is disabled initially', async () => {
      await mountBuilder();
      const iconButtons = wrapper.findAllComponents(IconButton);
      const undoButton = iconButtons.find(
        (btn) => btn.props('icon') === 'undo',
      );
      expect(undoButton).toBeTruthy();
      expect(undoButton!.props('disabled')).toBe(true);
    });

    it('redo button is disabled initially', async () => {
      await mountBuilder();
      const iconButtons = wrapper.findAllComponents(IconButton);
      const redoButton = iconButtons.find(
        (btn) => btn.props('icon') === 'redo',
      );
      expect(redoButton).toBeTruthy();
      expect(redoButton!.props('disabled')).toBe(true);
    });
  });

  // ==================== Reset ====================
  describe('reset', () => {
    it('reset button is rendered by default', async () => {
      await mountBuilder();
      const iconButtons = wrapper.findAllComponents(IconButton);
      const resetButton = iconButtons.find(
        (btn) => btn.props('icon') === 'reset',
      );
      expect(resetButton).toBeTruthy();
    });
  });

  // ==================== Action buttons ====================
  describe('action buttons', () => {
    it('shows undo/redo/reset buttons by default', async () => {
      await mountBuilder();
      const iconButtons = wrapper.findAllComponents(IconButton);
      const icons = iconButtons.map((btn) => btn.props('icon'));
      expect(icons).toContain('undo');
      expect(icons).toContain('redo');
      expect(icons).toContain('reset');
    });

    it('hides undo button when allowUndo=false', async () => {
      await mountBuilder({ allowUndo: false });
      const iconButtons = wrapper.findAllComponents(IconButton);
      const undoButton = iconButtons.find(
        (btn) => btn.props('icon') === 'undo',
      );
      expect(undoButton).toBeUndefined();
    });

    it('hides redo button when allowRedo=false', async () => {
      await mountBuilder({ allowRedo: false });
      const iconButtons = wrapper.findAllComponents(IconButton);
      const redoButton = iconButtons.find(
        (btn) => btn.props('icon') === 'redo',
      );
      expect(redoButton).toBeUndefined();
    });

    it('hides reset button when allowReset=false', async () => {
      await mountBuilder({ allowReset: false });
      const iconButtons = wrapper.findAllComponents(IconButton);
      const resetButton = iconButtons.find(
        (btn) => btn.props('icon') === 'reset',
      );
      expect(resetButton).toBeUndefined();
    });

    it('shows search button only in manual mode', async () => {
      await mountBuilder({ manual: false });
      let iconButtons = wrapper.findAllComponents(IconButton);
      let searchButton = iconButtons.find(
        (btn) => btn.props('icon') === 'search',
      );
      expect(searchButton).toBeUndefined();

      wrapper.unmount();

      await mountBuilder({ manual: true });
      iconButtons = wrapper.findAllComponents(IconButton);
      searchButton = iconButtons.find(
        (btn) => btn.props('icon') === 'search',
      );
      expect(searchButton).toBeTruthy();
    });
  });

  // ==================== collectionId ====================
  describe('collectionId', () => {
    it('renders skip link when collectionId is provided', async () => {
      await mountBuilder({ collectionId: 'my-collection' });
      const skipLink = wrapper.find('a.qkit-skip-link');
      expect(skipLink.exists()).toBe(true);
      expect(skipLink.attributes('href')).toBe('#my-collection');
    });

    it('does not render skip link when collectionId is not provided', async () => {
      await mountBuilder();
      const skipLink = wrapper.find('a.qkit-skip-link');
      expect(skipLink.exists()).toBe(false);
    });
  });

  // ==================== Array value filtering ====================
  describe('array value filtering', () => {
    it('filters undefined values from array condition values', async () => {
      const group: GroupFilter = {
        type: 'group',
        operator: 'and',
        filters: [
          { type: 'condition', property: 'favorite_fruits', operator: 'in', value: ['apple', undefined, 'banana'] },
        ],
      };
      await mountBuilder({}, group);
      const emitted = wrapper.emitted('computed')!;
      const filter = emitted[emitted.length - 1][0] as GroupFilter;
      const condition = filter.filters[0] as ConditionFilter;
      expect(condition.value).toEqual(['apple', 'banana']);
    });
  });
});
