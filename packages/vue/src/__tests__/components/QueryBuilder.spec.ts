import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QueryBuilder from '@components/QueryBuilder.vue';
import FilterBuilder from '@components/Filter/FilterBuilder.vue';
import FieldsBuilder from '@components/Collection/FieldsBuilder.vue';
import SortBuilder from '@components/Collection/SortBuilder.vue';
import FieldsListItem from '@components/Collection/FieldsListItem.vue';
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

async function mountQueryBuilder(props: Record<string, unknown> = {}, filter: Filter | null = null) {
  wrapper = mountWithPlugin(QueryBuilder, {
    props: {
      entity: 'user',
      filter,
      'onUpdate:filter': (v: unknown) => wrapper.setProps({ filter: v }),
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
      const label = inner.find('.qkit-builder-label');
      expect(label.text()).toBe('filter');
      expect(inner.attributes('aria-labelledby')).toBe(label.attributes('id'));
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
    it('forwards filter down to FilterBuilder', async () => {
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

    it('propagates a FilterBuilder update up to the parent as update:filter', async () => {
      await mountQueryBuilder();
      const newGroup: GroupFilter = {
        type: 'group',
        operator: 'and',
        filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Bob' }],
      };
      wrapper.findComponent(FilterBuilder).vm.$emit('update:modelValue', newGroup);
      await flushAll();
      const emitted = wrapper.emitted('update:filter');
      expect(emitted).toBeTruthy();
      expect(emitted!.at(-1)![0]).toEqual(newGroup);
    });
  });

  describe('edit propagation', () => {
    it('emits update:filter to the parent immediately and key-stripped on an in-place edit', async () => {
      await mountQueryBuilder();
      const before = wrapper.emitted('update:filter')?.length ?? 0;

      const internalGroup = wrapper.findComponent(Group).props('modelValue') as GroupFilter;
      internalGroup.filters.push({ type: 'condition', property: 'first_name', operator: '=', value: 'Alice', key: 123 });
      await flushAll(); // no timer advance: the parent emit is immediate, not debounced

      const emitted = wrapper.emitted('update:filter');
      expect(emitted?.length ?? 0).toBeGreaterThan(before);
      const last = emitted!.at(-1)![0] as GroupFilter;
      expect(last.filters).toHaveLength(1);
      expect(last.key).toBeUndefined();
      expect(last.filters[0]).not.toHaveProperty('key');
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

    describe('embedded (single builder, default)', () => {
      it('does not render the header when the filter builder is the only builder', async () => {
        await mountQueryBuilder();
        expect(wrapper.find('header.qkit-query-builder-header').exists()).toBe(false);
      });

      it('renders undo/redo/reset buttons inside the FilterBuilder', async () => {
        await mountQueryBuilder();
        const icons = iconsInScope('section.qkit-filter-builder');
        expect(icons).toContain('undo');
        expect(icons).toContain('redo');
        expect(icons).toContain('reset');
      });

      it('shows the search button inside the FilterBuilder only in manual mode', async () => {
        await mountQueryBuilder();
        expect(findActionButton('search')).toBeUndefined();
        wrapper.unmount();

        await mountQueryBuilder({ manual: true });
        expect(iconsInScope('section.qkit-filter-builder')).toContain('search');
      });
    });

    describe('header (fields builder present)', () => {
      it('renders the actions header with undo/redo/reset buttons when editFields is enabled', async () => {
        await mountQueryBuilder({ editFilter: true, editFields: true });
        const header = wrapper.find('header.qkit-query-builder-header');
        expect(header.exists()).toBe(true);
        const icons = iconsInScope('header.qkit-query-builder-header');
        expect(icons).toContain('undo');
        expect(icons).toContain('redo');
        expect(icons).toContain('reset');
      });

      it('places the header before the FilterBuilder section', async () => {
        await mountQueryBuilder({ editFilter: true, editFields: true });
        const children = Array.from(wrapper.find('section.qkit-query-builder').element.children);
        const headerIndex = children.findIndex((el) => el.tagName === 'HEADER');
        const filterIndex = children.findIndex(
          (el) => el.tagName === 'SECTION' && el.classList.contains('qkit-filter-builder'),
        );
        expect(headerIndex).toBeGreaterThanOrEqual(0);
        expect(filterIndex).toBeGreaterThanOrEqual(0);
        expect(headerIndex).toBeLessThan(filterIndex);
      });

      it('does not embed undo/redo/reset inside the FilterBuilder', async () => {
        await mountQueryBuilder({ editFilter: true, editFields: true });
        const icons = iconsInScope('section.qkit-filter-builder');
        expect(icons).not.toContain('undo');
        expect(icons).not.toContain('redo');
        expect(icons).not.toContain('reset');
      });

      it('shows the search button in the header in manual mode', async () => {
        await mountQueryBuilder({ editFilter: true, editFields: true, manual: true });
        expect(iconsInScope('header.qkit-query-builder-header')).toContain('search');
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
        await flushAll();

        const emitted = wrapper.emitted('update:filter')!;
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

      it('emits "validate" when the search button is clicked in manual mode', async () => {
        const group: GroupFilter = {
          type: 'group',
          operator: 'and',
          filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }],
        };
        await mountQueryBuilder({ manual: true }, group);

        await findActionButton('search')!.trigger('click');
        await flushAll();

        expect(wrapper.emitted('validate')).toHaveLength(1);
      });

      it('clears the history when the entity changes', async () => {
        const group: GroupFilter = {
          type: 'group',
          operator: 'and',
          filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }],
        };
        await mountQueryBuilder({}, group);

        const internalGroup = wrapper.findComponent(Group).props('modelValue') as GroupFilter;
        internalGroup.filters.push({ type: 'condition', property: 'last_name', operator: '=', value: 'Smith', key: 'k' });
        await flushAll();
        vi.advanceTimersByTime(1000);
        await flushAll();
        expect(findActionButton('undo')!.props('disabled')).toBe(false);

        await wrapper.setProps({ entity: 'organization' });
        await flushAll();
        vi.advanceTimersByTime(1000);
        await flushAll();

        expect(findActionButton('undo')!.props('disabled')).toBe(true);
      });
    });
  });

  describe('fields editing', () => {
    it('does not render the fields builder by default', async () => {
      await mountQueryBuilder();
      expect(wrapper.findComponent(FieldsBuilder).exists()).toBe(false);
      expect(wrapper.find('.qkit-fields-builder').exists()).toBe(false);
    });

    it('does not render the fields builder when editFields is false', async () => {
      await mountQueryBuilder({ editFields: false, fields: ['first_name'] });
      expect(wrapper.findComponent(FieldsBuilder).exists()).toBe(false);
    });

    it('renders the fields builder inline when editFields is true', async () => {
      await mountQueryBuilder({ editFields: true, fields: ['first_name'] });
      const section = wrapper.find('section.qkit-query-builder');
      expect(section.find('.qkit-fields-builder').exists()).toBe(true);
      expect(wrapper.findComponent(FieldsBuilder).exists()).toBe(true);
    });

    it('renders the fields builder after the filter builder', async () => {
      await mountQueryBuilder({ editFilter: true, editFields: true, fields: ['first_name'] });
      const children = Array.from(wrapper.find('section.qkit-query-builder').element.children);
      const filterIndex = children.findIndex(
        (el) => el.tagName === 'SECTION' && el.classList.contains('qkit-filter-builder'),
      );
      const fieldsIndex = children.findIndex((el) => el.classList.contains('qkit-fields-builder'));
      expect(filterIndex).toBeGreaterThanOrEqual(0);
      expect(fieldsIndex).toBeGreaterThanOrEqual(0);
      expect(filterIndex).toBeLessThan(fieldsIndex);
    });

    it('forwards fields and customFields down to the fields builder', async () => {
      const customFields = { first_name: { label: 'First' } };
      await mountQueryBuilder({ editFields: true, fields: ['first_name', 'last_name'], customFields });
      const builder = wrapper.findComponent(FieldsBuilder);
      expect(builder.props('modelValue')).toEqual(['first_name', 'last_name']);
      expect(builder.props('customFields')).toEqual(customFields);
    });

    it('propagates fields update from the fields builder to the parent', async () => {
      await mountQueryBuilder({ editFields: true, fields: ['first_name'] });
      wrapper.findComponent(FieldsBuilder).vm.$emit('update:modelValue', ['first_name', 'age']);
      await flushAll();
      const emitted = wrapper.emitted('update:fields');
      expect(emitted).toBeTruthy();
      expect(emitted!.at(-1)![0]).toEqual(['first_name', 'age']);
    });

    const actionButton = (icon: string) =>
      wrapper.findAllComponents(IconButton).find((b) => b.props('icon') === icon)!;

    // Remove the last field through the builder UI: a real internal edit, unlike an
    // update:modelValue emit which is an external reassignment (rebaselines, no commit).
    const removeLastField = () => wrapper.findAllComponents(FieldsListItem).at(-1)!.vm.$emit('remove');

    it('records a fields edit in the history and undoes it', async () => {
      await mountQueryBuilder({ editFields: true, fields: ['first_name', 'last_name'] });
      removeLastField();
      await flushAll();
      expect(wrapper.emitted('update:fields')!.at(-1)![0]).toEqual(['first_name']);
      expect(actionButton('undo').props('disabled')).toBe(false);

      await actionButton('undo').trigger('click');
      await flushAll();
      expect(wrapper.emitted('update:fields')!.at(-1)![0]).toEqual(['first_name', 'last_name']);
    });

    it('redoes an undone fields edit', async () => {
      await mountQueryBuilder({ editFields: true, fields: ['first_name', 'last_name'] });
      removeLastField();
      await flushAll();

      await actionButton('undo').trigger('click');
      await flushAll();
      expect(wrapper.emitted('update:fields')!.at(-1)![0]).toEqual(['first_name', 'last_name']);

      await actionButton('redo').trigger('click');
      await flushAll();
      expect(wrapper.emitted('update:fields')!.at(-1)![0]).toEqual(['first_name']);
    });

    it('resets fields to their initial value', async () => {
      await mountQueryBuilder({ editFields: true, fields: ['first_name', 'last_name'] });
      removeLastField();
      await flushAll();

      await actionButton('reset').trigger('click');
      await flushAll();
      expect(wrapper.emitted('update:fields')!.at(-1)![0]).toEqual(['first_name', 'last_name']);
    });
  });

  describe('sort editing', () => {
    it('does not render the sort builder by default', async () => {
      await mountQueryBuilder();
      expect(wrapper.findComponent(SortBuilder).exists()).toBe(false);
      expect(wrapper.find('.qkit-sort-builder').exists()).toBe(false);
    });

    it('renders the sort builder inline when editSort is true', async () => {
      await mountQueryBuilder({ editSort: true });
      expect(wrapper.find('section.qkit-query-builder').find('.qkit-sort-builder').exists()).toBe(true);
      expect(wrapper.findComponent(SortBuilder).exists()).toBe(true);
    });

    it('renders the sort builder after the filter builder', async () => {
      await mountQueryBuilder({ editFilter: true, editSort: true });
      const children = Array.from(wrapper.find('section.qkit-query-builder').element.children);
      const filterIndex = children.findIndex(
        (el) => el.tagName === 'SECTION' && el.classList.contains('qkit-filter-builder'),
      );
      const sortIndex = children.findIndex((el) => el.classList.contains('qkit-sort-builder'));
      expect(filterIndex).toBeGreaterThanOrEqual(0);
      expect(sortIndex).toBeGreaterThan(filterIndex);
    });

    it('forwards the sort model and customFields to the sort builder', async () => {
      const customFields = { first_name: { label: 'First' } };
      await mountQueryBuilder({ editSort: true, sort: [{ field: 'first_name', order: 'asc' }], customFields });
      const builder = wrapper.findComponent(SortBuilder);
      expect(builder.props('modelValue')).toEqual([{ field: 'first_name', order: 'asc' }]);
      expect(builder.props('customFields')).toEqual(customFields);
    });

    it('propagates a sort update from the sort builder to the parent', async () => {
      await mountQueryBuilder({ editSort: true });
      wrapper.findComponent(SortBuilder).vm.$emit('update:modelValue', [{ field: 'age', order: 'desc' }]);
      await flushAll();
      expect(wrapper.emitted('update:sort')!.at(-1)![0]).toEqual([{ field: 'age', order: 'desc' }]);
    });

    it('places the shared actions bar in the header when filter and sort are both shown', async () => {
      await mountQueryBuilder({ editFilter: true, editSort: true });
      expect(wrapper.find('header.qkit-query-builder-header').exists()).toBe(true);
    });
  });

  describe('filter visibility', () => {
    it('shows the filter by default (nothing enabled)', async () => {
      await mountQueryBuilder();
      expect(wrapper.findComponent(FilterBuilder).exists()).toBe(true);
    });

    it('hides the filter when only another builder is enabled', async () => {
      await mountQueryBuilder({ editFields: true });
      expect(wrapper.findComponent(FilterBuilder).exists()).toBe(false);
    });

    it('shows the filter when editFilter is true alongside another builder', async () => {
      await mountQueryBuilder({ editFilter: true, editFields: true });
      expect(wrapper.findComponent(FilterBuilder).exists()).toBe(true);
    });

    it('falls back to the filter when all builders are explicitly disabled', async () => {
      await mountQueryBuilder({ editFilter: false, editFields: false, editSort: false });
      expect(wrapper.findComponent(FilterBuilder).exists()).toBe(true);
    });
  });

  describe('runtime entity change', () => {
    it('re-resolves the schema when the entity changes at runtime', async () => {
      await mountQueryBuilder();
      await wrapper.setProps({ entity: 'organization' });
      await flushAll();
      const schema = wrapper.findComponent(FilterBuilder).props('entitySchema') as EntitySchema;
      expect(schema.id).toBe('organization');
    });
  });
});
