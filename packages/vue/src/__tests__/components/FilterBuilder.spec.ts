import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toRaw } from 'vue';
import FilterBuilder from '@components/Filter/FilterBuilder.vue';
import Group from '@components/Filter/Group.vue';
import { registerLoader, registerTranslationsLoader, resolve } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { flushAll } from '@tests/helpers/flushAsync';
import { useHistory } from '@components/Composable/History';
import type { VueWrapper } from '@vue/test-utils';
import type { Filter, GroupFilter } from '@core/types';

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

function makeGroup(filters: GroupFilter['filters'] = []): GroupFilter {
  return { type: 'group', operator: 'and', filters: filters.map((f, i) => ({ ...f, key: 'key-' + i })), key: 'root' };
}

async function mountFilterBuilder(props: Record<string, unknown> = {}, modelValue: Filter | null = makeGroup()) {
  const entitySchema = await resolve('user');
  wrapper = mountWithPlugin(FilterBuilder, {
    props: {
      entitySchema,
      modelValue,
      'onUpdate:modelValue': (v: Filter | null) => wrapper.setProps({ modelValue: v }),
      ...props,
    },
  });
  await flushAll();
}

describe('FilterBuilder', () => {
  describe('rendering', () => {
    it('renders section with aria-label "filter"', async () => {
      await mountFilterBuilder();
      const section = wrapper.find('section');
      expect(section.exists()).toBe(true);
      expect(section.attributes('aria-label')).toBe('filter');
    });

    it('renders Group with the provided entity schema', async () => {
      await mountFilterBuilder();
      expect(wrapper.findComponent(Group).exists()).toBe(true);
    });
  });

  describe('internal model sync', () => {
    it('mirrors modelValue into internalModel rendered by Group', async () => {
      const group = makeGroup([{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }]);
      await mountFilterBuilder({}, group);
      const internal = wrapper.findComponent(Group).props('modelValue') as GroupFilter;
      expect(internal.type).toBe('group');
      expect(internal.filters).toHaveLength(1);
      expect(internal.filters[0]).toEqual(expect.objectContaining({ property: 'first_name', value: 'Alice' }));
    });

    it('preserves the operator of the input group', async () => {
      const group: GroupFilter = {
        type: 'group',
        operator: 'or',
        key: 'root',
        filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Bob', key: 'k1' }],
      };
      await mountFilterBuilder({}, group);
      const internal = wrapper.findComponent(Group).props('modelValue') as GroupFilter;
      expect(internal.operator).toBe('or');
    });

    it('normalizes a null model into an empty group', async () => {
      await mountFilterBuilder({}, null);
      const internal = wrapper.findComponent(Group).props('modelValue') as GroupFilter;
      expect(internal.type).toBe('group');
      expect(internal.filters).toHaveLength(0);
    });

    it('wraps a non-group filter into a group', async () => {
      await mountFilterBuilder({}, { type: 'condition', property: 'first_name', operator: '=', value: 'Alice' });
      const internal = wrapper.findComponent(Group).props('modelValue') as GroupFilter;
      expect(internal.type).toBe('group');
      expect(internal.filters).toHaveLength(1);
      expect(internal.filters[0]).toEqual(expect.objectContaining({ property: 'first_name', value: 'Alice' }));
    });

    it('re-syncs the working copy when the parent replaces modelValue', async () => {
      await mountFilterBuilder({}, makeGroup([{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }]));
      await wrapper.setProps({
        modelValue: makeGroup([{ type: 'condition', property: 'last_name', operator: '=', value: 'Smith' }]),
      });
      await flushAll();
      const internal = wrapper.findComponent(Group).props('modelValue') as GroupFilter;
      expect(internal.filters).toHaveLength(1);
      expect(internal.filters[0]).toEqual(expect.objectContaining({ property: 'last_name', value: 'Smith' }));
    });

    it('does NOT emit update:modelValue on mount (the working copy is internal until a real edit)', async () => {
      await mountFilterBuilder();
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });
  });

  describe('user mutations', () => {
    it('edits a normalized working copy (not the parent object) and emits a key-stripped update', async () => {
      const model = makeGroup();
      await mountFilterBuilder({}, model);

      // FilterBuilder owns the boundary now: Group renders an internal working copy, not the parent object.
      const working = wrapper.findComponent(Group).props('modelValue') as GroupFilter;
      expect(toRaw(working)).not.toBe(model);

      working.filters.push({
        type: 'condition',
        property: 'first_name',
        operator: '=',
        value: 'Alice',
        key: 'new-1',
      });
      await flushAll();

      const emitted = wrapper.emitted('update:modelValue');
      expect(emitted).toBeTruthy();
      const last = emitted!.at(-1)![0] as GroupFilter;
      expect(last.filters).toHaveLength(1);
      expect(last.filters[0]).toEqual(expect.objectContaining({ property: 'first_name', value: 'Alice' }));
      expect(last.key).toBeUndefined();
      expect(last.filters[0]).not.toHaveProperty('key');
    });
  });

  describe('history integration', () => {
    it('registers its working copy so an edit becomes undoable', async () => {
      const history = useHistory();
      await mountFilterBuilder({ history });

      const working = wrapper.findComponent(Group).props('modelValue') as GroupFilter;
      expect(history.canUndo.value).toBe(false);

      working.filters.push({ type: 'condition', property: 'first_name', operator: '=', value: 'Alice', key: 'k' });
      await flushAll();

      expect(history.canUndo.value).toBe(true);
    });

    it('reflects a history undo back into the rendered working copy', async () => {
      const history = useHistory();
      await mountFilterBuilder({ history });

      const working = wrapper.findComponent(Group).props('modelValue') as GroupFilter;
      working.filters.push({ type: 'condition', property: 'first_name', operator: '=', value: 'Alice', key: 'k' });
      await flushAll();

      history.undo();
      await flushAll();

      expect((wrapper.findComponent(Group).props('modelValue') as GroupFilter).filters).toHaveLength(0);
    });

    it('unregisters its slice on unmount', async () => {
      const history = useHistory();
      await mountFilterBuilder({ history });
      const working = wrapper.findComponent(Group).props('modelValue') as GroupFilter;

      wrapper.unmount();
      working.filters.push({ type: 'condition', property: 'x', operator: '=', value: 'y', key: 'k' });
      await flushAll();

      expect(history.canUndo.value).toBe(false);
    });
  });

  describe('go to collection', () => {
    it('scrolls to the collection on every exit (not just the first)', async () => {
      const collectionId = 'col-test';
      const target = document.createElement('div');
      target.id = collectionId;
      document.body.appendChild(target);
      const scrollIntoView = vi.spyOn(target, 'scrollIntoView');

      await mountFilterBuilder({ collectionId });

      const group = wrapper.findComponent(Group);
      group.vm.$emit('exit');
      await flushAll();
      group.vm.$emit('exit');
      await flushAll();

      expect(scrollIntoView).toHaveBeenCalledTimes(2);
      target.remove();
    });
  });

  describe('config defaults and overrides', () => {
    it('uses global config defaults when no props are provided', async () => {
      await mountFilterBuilder();
      const vm = wrapper.vm as any;
      expect(vm.config.userTimezone).toBe('UTC');
      expect(vm.config.requestTimezone).toBe('UTC');
      expect(vm.config.displayOperator).toBe(true);
      expect(vm.config.aliasInsensitiveLabels).toBe(false);
    });

    it('overrides config properties via props', async () => {
      await mountFilterBuilder({
        userTimezone: 'Europe/Paris',
        requestTimezone: 'America/New_York',
        displayOperator: false,
        aliasInsensitiveLabels: true,
      });
      const vm = wrapper.vm as any;
      expect(vm.config.userTimezone).toBe('Europe/Paris');
      expect(vm.config.requestTimezone).toBe('America/New_York');
      expect(vm.config.displayOperator).toBe(false);
      expect(vm.config.aliasInsensitiveLabels).toBe(true);
    });
  });
});
