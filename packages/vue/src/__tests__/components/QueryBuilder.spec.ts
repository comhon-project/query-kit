import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QueryBuilder from '@components/QueryBuilder.vue';
import FilterBuilder from '@components/Filter/FilterBuilder.vue';
import Group from '@components/Filter/Group.vue';
import IconButton from '@components/Common/IconButton.vue';
import InvalidEntity from '@components/Messages/InvalidEntity.vue';
import type { EntitySchema } from '@core/EntitySchema';
import { registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { flushAll } from '@tests/helpers/flushAsync';
import type { VueWrapper } from '@vue/test-utils';
import type { Filter, GroupFilter } from '@core/types';

const { computeFilterSpy } = vi.hoisted(() => ({ computeFilterSpy: vi.fn() }));
vi.mock('@core/computeFilter', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@core/computeFilter')>();
  computeFilterSpy.mockImplementation(orig.computeFilter);
  return { ...orig, computeFilter: (...args: Parameters<typeof orig.computeFilter>) => computeFilterSpy(...args) };
});

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
    it('resolves the entity once and forwards the schema to FilterBuilder', async () => {
      await mountQueryBuilder({ entity: 'user' });
      const schema = wrapper.findComponent(FilterBuilder).props('entitySchema') as EntitySchema;
      expect(schema).toBeTruthy();
      expect(schema.id).toBe('user');
    });

    it('renders InvalidEntity and no FilterBuilder when the entity is invalid', async () => {
      await mountQueryBuilder({ entity: 'nonexistent_entity' });
      expect(wrapper.findComponent(InvalidEntity).exists()).toBe(true);
      expect(wrapper.findComponent(FilterBuilder).exists()).toBe(false);
    });

    it('forwards every optional prop with the exact value', async () => {
      await mountQueryBuilder({
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
      expect(child.props('allowedScopes')).toEqual({ user: ['active'] });
      expect(child.props('allowedProperties')).toEqual({ user: ['first_name'] });
      expect(child.props('allowedOperators')).toEqual({ condition: { string: ['=', '<>'] } });
      expect(child.props('displayOperator')).toEqual({ group: false, condition: true, entity_condition: true });
      expect(child.props('userTimezone')).toBe('Europe/Paris');
      expect(child.props('requestTimezone')).toBe('America/New_York');
      expect(child.props('collectionId')).toBe('my-collection');
      expect(child.props('aliasInsensitiveLabels')).toBe(true);
    });

    it('keeps optional booleans undefined when omitted (no false coercion)', async () => {
      await mountQueryBuilder();
      const child = wrapper.findComponent(FilterBuilder);
      expect(child.props('aliasInsensitiveLabels')).toBeUndefined();
      expect(child.props('displayOperator')).toBeUndefined();
    });

    it('does not forward orchestrator-level props (allow-* / manual) to FilterBuilder', async () => {
      await mountQueryBuilder({ allowReset: false, allowUndo: false, allowRedo: false, manual: true });
      const childProps = Object.keys(wrapper.findComponent(FilterBuilder).props());
      expect(childProps).not.toContain('allowReset');
      expect(childProps).not.toContain('allowUndo');
      expect(childProps).not.toContain('allowRedo');
      expect(childProps).not.toContain('manual');
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

  describe('boundary (in-place mutation)', () => {
    it('emits update:modelValue to the parent immediately and key-stripped on an in-place edit', async () => {
      await mountQueryBuilder();
      const before = wrapper.emitted('update:modelValue')?.length ?? 0;

      const internalGroup = wrapper.findComponent(Group).props('modelValue') as GroupFilter;
      internalGroup.filters.push({ type: 'condition', property: 'first_name', operator: '=', value: 'Alice', key: 123 });
      await flushAll(); // no timer advance: the parent emit is immediate, not debounced

      const emitted = wrapper.emitted('update:modelValue');
      expect(emitted?.length ?? 0).toBeGreaterThan(before);
      const last = emitted!.at(-1)![0] as GroupFilter;
      expect(last.filters).toHaveLength(1);
      expect(last.key).toBeUndefined();
      expect(last.filters[0]).not.toHaveProperty('key');
    });

    it('debounces the computed event on edits (no compute until the window elapses)', async () => {
      await mountQueryBuilder({ debounce: 2000 });
      const before = wrapper.emitted('computed')!.length;

      const internalGroup = wrapper.findComponent(Group).props('modelValue') as GroupFilter;
      internalGroup.filters.push({ type: 'condition', property: 'first_name', operator: '=', value: 'Alice', key: 1 });
      await flushAll();

      vi.advanceTimersByTime(1000);
      await flushAll();
      expect(wrapper.emitted('computed')!.length).toBe(before);

      vi.advanceTimersByTime(1000);
      await flushAll();
      expect(wrapper.emitted('computed')!.length).toBe(before + 1);
    });
  });

  describe('actions', () => {
    function findActionButton(icon: string) {
      return wrapper.findAllComponents(IconButton).find((btn) => btn.props('icon') === icon);
    }

    function iconsInScope(scopeSelector: string): string[] {
      const scope = wrapper.find(scopeSelector).element;
      return wrapper
        .findAllComponents(IconButton)
        .filter((btn) => scope.contains(btn.element))
        .map((btn) => btn.props('icon') as string);
    }

    describe('header mode (default)', () => {
      it('renders the actions header with undo/redo/reset buttons by default', async () => {
        await mountQueryBuilder();
        const header = wrapper.find('header.qkit-query-builder-header');
        expect(header.exists()).toBe(true);
        const icons = iconsInScope('header.qkit-query-builder-header');
        expect(icons).toContain('undo');
        expect(icons).toContain('redo');
        expect(icons).toContain('reset');
      });

      it('places the header before the FilterBuilder section', async () => {
        await mountQueryBuilder();
        const wrapperSection = wrapper.find('section.qkit-query-builder');
        const children = Array.from(wrapperSection.element.children);
        const headerIndex = children.findIndex((el) => el.tagName === 'HEADER');
        const filterIndex = children.findIndex(
          (el) => el.tagName === 'SECTION' && el.classList.contains('qkit-filter-builder'),
        );
        expect(headerIndex).toBeGreaterThanOrEqual(0);
        expect(filterIndex).toBeGreaterThanOrEqual(0);
        expect(headerIndex).toBeLessThan(filterIndex);
      });

      it('shows search button only in manual mode', async () => {
        await mountQueryBuilder();
        expect(findActionButton('search')).toBeUndefined();
        wrapper.unmount();

        await mountQueryBuilder({ manual: true });
        expect(findActionButton('search')).toBeDefined();
      });

      it('does not render the header inside the FilterBuilder', async () => {
        await mountQueryBuilder();
        const filterSection = wrapper.find('section.qkit-filter-builder');
        expect(filterSection.find('header.qkit-query-builder-header').exists()).toBe(false);
      });
    });

    describe('embedded mode', () => {
      it('does not render the header when actionsLocation="embedded"', async () => {
        await mountQueryBuilder({ actionsLocation: 'embedded' });
        expect(wrapper.find('header.qkit-query-builder-header').exists()).toBe(false);
      });

      it('renders action buttons inside FilterBuilder when actionsLocation="embedded"', async () => {
        await mountQueryBuilder({ actionsLocation: 'embedded' });
        const icons = iconsInScope('section.qkit-filter-builder');
        expect(icons).toContain('undo');
        expect(icons).toContain('redo');
        expect(icons).toContain('reset');
      });

      it('shows search button in embedded mode when manual=true', async () => {
        await mountQueryBuilder({ actionsLocation: 'embedded', manual: true });
        const icons = iconsInScope('section.qkit-filter-builder');
        expect(icons).toContain('search');
      });
    });

    describe('behavior', () => {
      it('reset restores the original filter', async () => {
        const group: GroupFilter = {
          type: 'group',
          operator: 'and',
          filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }],
        };
        await mountQueryBuilder({}, group);

        const groupComp = wrapper.findComponent(Group);
        const internalGroup = groupComp.props('modelValue') as GroupFilter;
        internalGroup.filters.push({
          type: 'condition',
          property: 'last_name',
          operator: '=',
          value: 'Smith',
          key: 999,
        });
        vi.advanceTimersByTime(1000);
        await flushAll();

        await findActionButton('reset')!.trigger('click');
        vi.advanceTimersByTime(1000);
        await flushAll();

        const emitted = wrapper.emitted('computed')!;
        const lastFilter = emitted.at(-1)![0] as GroupFilter;
        expect(lastFilter.filters).toHaveLength(1);
      });

      it('undo enables redo, redo enables undo again', async () => {
        const group: GroupFilter = {
          type: 'group',
          operator: 'and',
          filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }],
        };
        await mountQueryBuilder({}, group);

        const internalGroup = wrapper.findComponent(Group).props('modelValue') as GroupFilter;
        internalGroup.filters.push({
          type: 'condition',
          property: 'last_name',
          operator: '=',
          value: 'Smith',
          key: 999,
        });
        await flushAll();
        vi.advanceTimersByTime(1000);
        await flushAll();

        expect(findActionButton('undo')!.props('disabled')).toBe(false);
        await findActionButton('undo')!.trigger('click');
        vi.advanceTimersByTime(1000);
        await flushAll();

        expect(findActionButton('redo')!.props('disabled')).toBe(false);
        await findActionButton('redo')!.trigger('click');
        vi.advanceTimersByTime(1000);
        await flushAll();

        expect(findActionButton('undo')!.props('disabled')).toBe(false);
      });

      it('validate emits computed with manual=true in manual mode', async () => {
        const group: GroupFilter = {
          type: 'group',
          operator: 'and',
          filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }],
        };
        await mountQueryBuilder({ manual: true }, group);

        await findActionButton('search')!.trigger('click');
        await flushAll();

        const emitted = wrapper.emitted('computed')!;
        expect(emitted.at(-1)![1]).toBe(true);
      });
    });
  });

  describe('computed event', () => {
    it('emits "computed" with manual=false on initial settle (non-manual mode)', async () => {
      await mountQueryBuilder();
      const emits = wrapper.emitted('computed');
      expect(emits).toBeTruthy();
      const last = emits!.at(-1)!;
      expect((last[0] as GroupFilter).type).toBe('group');
      expect(last[1]).toBe(false);
    });

    it('still emits the first "computed" in manual mode (so a parent like Search can render Collection)', async () => {
      await mountQueryBuilder({ manual: true });
      const emits = wrapper.emitted('computed');
      expect(emits).toBeTruthy();
      expect(emits!.length).toBeGreaterThanOrEqual(1);
      expect(emits!.at(-1)![1]).toBe(false);
    });

    it('does not auto-emit further "computed" events in manual mode after the initial one', async () => {
      const group: GroupFilter = {
        type: 'group',
        operator: 'and',
        filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }],
      };
      await mountQueryBuilder({ manual: true }, group);
      const initialCount = wrapper.emitted('computed')!.length;

      const internalGroup = wrapper.findComponent(Group).props('modelValue') as GroupFilter;
      internalGroup.filters.push({
        type: 'condition',
        property: 'last_name',
        operator: '=',
        value: 'Smith',
        key: 99,
      });
      vi.advanceTimersByTime(1000);
      await flushAll();

      expect(wrapper.emitted('computed')!.length).toBe(initialCount);
    });

    it('warns and emits nothing when computeFilter throws', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      computeFilterSpy.mockRejectedValueOnce(new Error('boom'));

      await mountQueryBuilder();

      expect(wrapper.emitted('computed')).toBeUndefined();
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    it('drops a stale in-flight compute that resolves after a newer one', async () => {
      const resultA: GroupFilter = { type: 'group', operator: 'and', filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'A' }] };
      const resultB: GroupFilter = { type: 'group', operator: 'and', filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'B' }] };
      let resolveA!: (v: GroupFilter) => void;
      let resolveB!: (v: GroupFilter) => void;
      computeFilterSpy
        .mockImplementationOnce(() => new Promise((r) => (resolveA = r)))
        .mockImplementationOnce(() => new Promise((r) => (resolveB = r)));

      wrapper = mountWithPlugin(QueryBuilder, {
        props: { entity: 'user', modelValue: null, 'onUpdate:modelValue': (v: unknown) => wrapper.setProps({ modelValue: v }) },
      });
      await flushAll(); // compute A is in flight

      // a filter edit schedules a second (debounced) compute B
      const group = wrapper.findComponent(Group).props('modelValue') as GroupFilter;
      group.filters.push({ type: 'condition', property: 'first_name', operator: '=', value: 'x', key: 1 });
      await flushAll();
      vi.advanceTimersByTime(1000);
      await flushAll(); // compute B is in flight

      // the newer compute (B) resolves before the older one (A)
      resolveB(resultB);
      await flushAll();
      resolveA(resultA);
      await flushAll();

      const emits = wrapper.emitted('computed')!;
      expect(emits).toHaveLength(1);
      expect(emits.at(-1)![0]).toEqual(resultB);
    });

    it('does not re-emit "computed" when an edit leaves the computed result unchanged (dedup)', async () => {
      await mountQueryBuilder();
      const before = wrapper.emitted('computed')!.length;

      // An empty condition is stripped by computeFilter → identical result → no emit.
      const group = wrapper.findComponent(Group).props('modelValue') as GroupFilter;
      group.filters.push({ type: 'condition', property: 'first_name', operator: '=', value: undefined, key: 1 });
      await flushAll();
      vi.advanceTimersByTime(1000);
      await flushAll();
      expect(wrapper.emitted('computed')!.length).toBe(before);

      // A filled condition changes the result → exactly one new emit.
      group.filters.push({ type: 'condition', property: 'first_name', operator: '=', value: 'Alice', key: 2 });
      await flushAll();
      vi.advanceTimersByTime(1000);
      await flushAll();
      expect(wrapper.emitted('computed')!.length).toBe(before + 1);
    });

    it('warns and emits nothing when computeFilter throws on a manual validate', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await mountQueryBuilder({ manual: true });
      const before = wrapper.emitted('computed')!.length;

      computeFilterSpy.mockRejectedValueOnce(new Error('boom'));
      const searchBtn = wrapper.findAllComponents(IconButton).find((btn) => btn.props('icon') === 'search');
      await searchBtn!.trigger('click');
      await flushAll();

      expect(wrapper.emitted('computed')!.length).toBe(before);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    it('re-resolves the schema and re-emits "computed" when the entity changes at runtime', async () => {
      await mountQueryBuilder();
      const before = wrapper.emitted('computed')!.length;

      await wrapper.setProps({ entity: 'organization' });
      await flushAll();
      vi.advanceTimersByTime(1000);
      await flushAll();

      const schema = wrapper.findComponent(FilterBuilder).props('entitySchema') as EntitySchema;
      expect(schema.id).toBe('organization');
      expect(wrapper.emitted('computed')!.length).toBeGreaterThan(before);
      expect(computeFilterSpy).toHaveBeenLastCalledWith(expect.anything(), 'organization');
    });
  });
});
