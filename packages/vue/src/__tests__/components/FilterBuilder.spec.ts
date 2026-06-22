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
import type { VueWrapper } from '@vue/test-utils';
import type { GroupFilter } from '@core/types';

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

async function mountFilterBuilder(props: Record<string, unknown> = {}, modelValue: GroupFilter = makeGroup()) {
  const entitySchema = await resolve('user');
  wrapper = mountWithPlugin(FilterBuilder, {
    props: {
      entitySchema,
      modelValue,
      'onUpdate:modelValue': (v: GroupFilter) => wrapper.setProps({ modelValue: v }),
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

    it('does NOT re-emit update:modelValue on initial mount (parent already supplied the canonical form)', async () => {
      await mountFilterBuilder();
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });
  });

  describe('user mutations', () => {
    it('applies mutations in place on the supplied model without emitting update:modelValue', async () => {
      const model = makeGroup();
      await mountFilterBuilder({}, model);

      // Group receives the very object the parent supplied (no internal copy).
      const rendered = wrapper.findComponent(Group).props('modelValue') as GroupFilter;
      expect(toRaw(rendered)).toBe(model);

      rendered.filters.push({
        type: 'condition',
        property: 'first_name',
        operator: '=',
        value: 'Alice',
        key: 'new-1',
      });
      await flushAll();

      // FilterBuilder mutates in place; the boundary (normalize/strip, emit) lives in QueryBuilder.
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
      expect(model.filters).toHaveLength(1);
      expect(model.filters[0]).toEqual(expect.objectContaining({ property: 'first_name', value: 'Alice', key: 'new-1' }));
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
