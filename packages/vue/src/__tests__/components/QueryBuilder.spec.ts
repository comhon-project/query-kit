import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QueryBuilder from '@components/QueryBuilder.vue';
import FilterBuilder from '@components/Filter/FilterBuilder.vue';
import { registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { flushAll } from '@tests/helpers/flushAsync';
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

async function mountQueryBuilder(props: Record<string, unknown> = {}, modelValue: Filter | null = null) {
  wrapper = mountWithPlugin(QueryBuilder, {
    props: {
      entity: 'user',
      modelValue,
      'onUpdate:modelValue': (v: unknown) => wrapper.setProps({ modelValue: v }),
      ...props,
    },
  });
  await flushAll();
  vi.advanceTimersByTime(1000);
  await flushAll();
}

describe('QueryBuilder', () => {
  describe('rendering', () => {
    it('renders a section wrapper with class qkit-query-builder and aria-label', async () => {
      await mountQueryBuilder();
      const sections = wrapper.findAll('section');
      const wrapperSection = sections.find((s) => s.classes('qkit-query-builder'));
      expect(wrapperSection).toBeDefined();
      expect(wrapperSection!.attributes('aria-label')).toBe('query builder');
    });

    it('nests the FilterBuilder section inside the query-builder wrapper', async () => {
      await mountQueryBuilder();
      const wrapperSection = wrapper.find('section.qkit-query-builder');
      expect(wrapperSection.exists()).toBe(true);
      const inner = wrapperSection.find('section.qkit-filter-builder');
      expect(inner.exists()).toBe(true);
      expect(inner.attributes('aria-label')).toBe('filter');
    });

    it('renders a FilterBuilder child', async () => {
      await mountQueryBuilder();
      expect(wrapper.findComponent(FilterBuilder).exists()).toBe(true);
    });
  });

  describe('skip link', () => {
    it('renders skip link when collectionId is provided', async () => {
      await mountQueryBuilder({ collectionId: 'my-collection' });
      const skipLink = wrapper.find('a.qkit-skip-link');
      expect(skipLink.exists()).toBe(true);
      expect(skipLink.attributes('href')).toBe('#my-collection');
    });

    it('does not render skip link when collectionId is not provided', async () => {
      await mountQueryBuilder();
      const skipLink = wrapper.find('a.qkit-skip-link');
      expect(skipLink.exists()).toBe(false);
    });

    it('renders the skip link before the FilterBuilder section', async () => {
      await mountQueryBuilder({ collectionId: 'my-collection' });
      const wrapperSection = wrapper.find('section.qkit-query-builder');
      const children = Array.from(wrapperSection.element.children);
      const linkIndex = children.findIndex((el) => el.tagName === 'A' && el.classList.contains('qkit-skip-link'));
      const filterBuilderIndex = children.findIndex(
        (el) => el.tagName === 'SECTION' && el.classList.contains('qkit-filter-builder'),
      );
      expect(linkIndex).toBeGreaterThanOrEqual(0);
      expect(filterBuilderIndex).toBeGreaterThanOrEqual(0);
      expect(linkIndex).toBeLessThan(filterBuilderIndex);
    });
  });

  describe('prop forwarding', () => {
    it('forwards entity', async () => {
      await mountQueryBuilder({ entity: 'user' });
      expect(wrapper.findComponent(FilterBuilder).props('entity')).toBe('user');
    });

    it('forwards every optional prop with the exact value', async () => {
      await mountQueryBuilder({
        allowReset: false,
        allowUndo: false,
        allowRedo: false,
        allowedScopes: { user: ['active'] },
        allowedProperties: { user: ['first_name'] },
        allowedOperators: { condition: { string: ['=', '<>'] } },
        displayOperator: { group: false, condition: true, entity_condition: true },
        userTimezone: 'Europe/Paris',
        requestTimezone: 'America/New_York',
        debounce: 2000,
        collectionId: 'my-collection',
        manual: true,
        aliasInsensitiveLabels: true,
      });
      const child = wrapper.findComponent(FilterBuilder);
      expect(child.props('allowReset')).toBe(false);
      expect(child.props('allowUndo')).toBe(false);
      expect(child.props('allowRedo')).toBe(false);
      expect(child.props('allowedScopes')).toEqual({ user: ['active'] });
      expect(child.props('allowedProperties')).toEqual({ user: ['first_name'] });
      expect(child.props('allowedOperators')).toEqual({ condition: { string: ['=', '<>'] } });
      expect(child.props('displayOperator')).toEqual({ group: false, condition: true, entity_condition: true });
      expect(child.props('userTimezone')).toBe('Europe/Paris');
      expect(child.props('requestTimezone')).toBe('America/New_York');
      expect(child.props('debounce')).toBe(2000);
      expect(child.props('collectionId')).toBe('my-collection');
      expect(child.props('manual')).toBe(true);
      expect(child.props('aliasInsensitiveLabels')).toBe(true);
    });

    it('keeps optional booleans undefined when omitted (no false coercion)', async () => {
      await mountQueryBuilder();
      const child = wrapper.findComponent(FilterBuilder);
      expect(child.props('allowReset')).toBeUndefined();
      expect(child.props('allowUndo')).toBeUndefined();
      expect(child.props('allowRedo')).toBeUndefined();
      expect(child.props('manual')).toBeUndefined();
      expect(child.props('aliasInsensitiveLabels')).toBeUndefined();
      expect(child.props('displayOperator')).toBeUndefined();
    });
  });

  describe('v-model forwarding', () => {
    it('forwards modelValue down to FilterBuilder', async () => {
      const group: GroupFilter = {
        type: 'group',
        operator: 'or',
        filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }],
      };
      await mountQueryBuilder({}, group);
      const child = wrapper.findComponent(FilterBuilder);
      const childModel = child.props('modelValue') as GroupFilter;
      expect(childModel).not.toBeNull();
      expect(childModel.type).toBe('group');
      expect(childModel.operator).toBe('or');
      expect(childModel.filters).toHaveLength(1);
      expect(childModel.filters[0]).toEqual(
        expect.objectContaining({ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }),
      );
    });

    it('propagates update:modelValue from FilterBuilder up to the parent', async () => {
      await mountQueryBuilder();
      const newGroup: GroupFilter = {
        type: 'group',
        operator: 'and',
        filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Bob' }],
      };
      wrapper.findComponent(FilterBuilder).vm.$emit('update:modelValue', newGroup);
      await flushAll();
      const emitted = wrapper.emitted('update:modelValue');
      expect(emitted).toBeTruthy();
      expect(emitted!.at(-1)![0]).toEqual(newGroup);
    });
  });

  describe('event forwarding', () => {
    it('re-emits "computed" with the same filter and manual flag', async () => {
      await mountQueryBuilder();
      const childEmits = wrapper.findComponent(FilterBuilder).emitted('computed');
      const parentEmits = wrapper.emitted('computed');
      expect(childEmits).toBeTruthy();
      expect(parentEmits).toBeTruthy();
      expect(parentEmits!.length).toBe(childEmits!.length);
      const lastChild = childEmits!.at(-1)!;
      const lastParent = parentEmits!.at(-1)!;
      expect(lastParent[0]).toEqual(lastChild[0]);
      expect(lastParent[1]).toBe(lastChild[1]);
      expect(lastParent[1]).toBe(false);
    });

    it('re-emits "computed" with manual=true when triggered manually', async () => {
      await mountQueryBuilder({ manual: true });
      const child = wrapper.findComponent(FilterBuilder);
      child.vm.$emit('computed', { type: 'group', operator: 'and', filters: [] }, true);
      await flushAll();
      const parentEmits = wrapper.emitted('computed');
      expect(parentEmits).toBeTruthy();
      const last = parentEmits!.at(-1)!;
      expect(last[0]).toEqual({ type: 'group', operator: 'and', filters: [] });
      expect(last[1]).toBe(true);
    });
  });
});
