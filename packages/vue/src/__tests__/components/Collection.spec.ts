import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { defineComponent, h, markRaw, reactive, ref } from 'vue';
import Collection from '@components/Collection/Collection.vue';
import CollectionTable from '@components/Collection/CollectionTable.vue';
import FieldsEditor from '@components/Collection/FieldsEditor.vue';
import { registerLoader, registerTranslationsLoader, loadRawTranslations } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { registerRequester, registerRequestErrorHandler } from '@core/Requester';
import { locale, loadedTranslations } from '@i18n/i18n';
import fr from '@i18n/locales/fr';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { flushAll } from '@tests/helpers/flushAsync';
import { createMockRequester } from '@tests/helpers/createMockRequester';
import { computeFilter } from '@core/computeFilter';
import type { Filter, EntityConditionFilter } from '@core/types';
import type { VueWrapper } from '@vue/test-utils';

let wrapper: VueWrapper;

const sampleRows = [
  { id: 1, first_name: 'John', last_name: 'Doe', age: 30, gender: 'male' },
  { id: 2, first_name: 'Jane', last_name: 'Smith', age: 25, gender: 'female' },
];

beforeEach(async () => {
  registerLoader(entitySchemaLoader);
  registerTranslationsLoader(entityTranslationsLoader);
  registerRequestLoader(requestSchemaLoader);
});

afterEach(() => {
  wrapper?.unmount();
});

function mountCollection(overrides: Record<string, any> = {}, requesterOverrides: Record<string, any> = {}) {
  const { requester, calls } = createMockRequester({
    collection: sampleRows,
    count: 2,
    ...requesterOverrides,
  });

  const fields = ref(overrides.fields ?? ['first_name', 'last_name']);

  wrapper = mountWithPlugin(Collection, {
    props: {
      entity: 'user',
      limit: 10,
      fields: fields.value,
      'onUpdate:fields': (v: string[]) => { fields.value = v; },
      requester,
      ...overrides,
    },
  });

  return { requester, calls, fields };
}

describe('Collection', () => {
  it('calls requester on mount with directQuery', async () => {
    const { calls } = mountCollection();
    await flushAll();
    expect(calls).toHaveLength(1);
    expect(calls[0].entity).toBe('user');
    expect(calls[0].limit).toBe(10);
    expect(calls[0].page).toBe(1);
  });

  it('does not call requester on mount when directQuery is false', async () => {
    const { calls } = mountCollection({ directQuery: false });
    await flushAll();
    expect(calls).toHaveLength(0);
  });

  it('renders headers for each column', async () => {
    mountCollection();
    await flushAll();
    const headers = wrapper.findAll('th');
    expect(headers.length).toBe(2);
  });

  it('renders cells for each row and column', async () => {
    mountCollection();
    await flushAll();
    const rows = wrapper.findAll('tbody tr');
    // 2 data rows + 1 sentinel row
    expect(rows.length).toBeGreaterThanOrEqual(2);
    const cells = wrapper.findAll('td');
    // 2 rows × 2 columns + 1 sentinel td
    expect(cells.length).toBeGreaterThanOrEqual(4);
    expect(wrapper.text()).toContain('John');
    expect(wrapper.text()).toContain('Smith');
  });

  it('sends a new request when page changes', async () => {
    const page = ref(1);
    const { requester, calls } = createMockRequester({ collection: sampleRows, count: 100 });
    wrapper = mountWithPlugin(Collection, {
      props: {
        entity: 'user',
        limit: 10,
        fields: ['first_name'],
        'onUpdate:fields': () => {},
        requester,
        page: page.value,
        'onUpdate:page': (v: number) => { page.value = v; },
      },
    });
    await flushAll();
    expect(calls).toHaveLength(1);

    // Simulate page change
    await wrapper.setProps({ page: 2 });
    await flushAll();
    expect(calls).toHaveLength(2);
    expect(calls[1].page).toBe(2);
  });

  it('sends sort order in request after sort click', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const sort = ref<any[]>([]);
    const { requester } = createMockRequester({ collection: sampleRows, count: 2 });
    wrapper = mountWithPlugin(Collection, {
      props: {
        entity: 'user',
        limit: 10,
        fields: ['first_name', 'last_name'],
        'onUpdate:fields': () => {},
        requester,
        sort: sort.value,
        'onUpdate:sort': (v: any[]) => { sort.value = v; },
      },
    });
    await flushAll();

    // Click sort on first_name header (sort emit is debounced 300ms in CollectionTable)
    const sortButton = wrapper.find('th button');
    await sortButton.trigger('click');
    vi.advanceTimersByTime(300);
    await flushAll();

    expect(sort.value).toEqual([{ field: 'first_name', order: 'asc' }]);
    vi.useRealTimers();
  });

  it('cycles sort order: undefined → asc → desc → undefined', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const sort = ref<any[]>([]);
    const { requester } = createMockRequester({ collection: sampleRows, count: 2 });
    wrapper = mountWithPlugin(Collection, {
      props: {
        entity: 'user',
        limit: 10,
        fields: ['first_name'],
        'onUpdate:fields': () => {},
        requester,
        sort: sort.value,
        'onUpdate:sort': (v: any[]) => {
          sort.value = v;
          wrapper.setProps({ sort: v });
        },
      },
    });
    await flushAll();

    const sortButton = wrapper.find('th button');

    // First click → asc
    await sortButton.trigger('click');
    vi.advanceTimersByTime(300);
    await flushAll();
    expect(sort.value).toEqual([{ field: 'first_name', order: 'asc' }]);

    // Second click → desc
    await sortButton.trigger('click');
    vi.advanceTimersByTime(300);
    await flushAll();
    expect(sort.value).toEqual([{ field: 'first_name', order: 'desc' }]);

    // Third click → removed
    await sortButton.trigger('click');
    vi.advanceTimersByTime(300);
    await flushAll();
    expect(sort.value).toEqual([]);
    vi.useRealTimers();
  });

  it('computes the filter before passing it to the requester', async () => {
    const filter: Filter = {
      type: 'group',
      operator: 'and',
      filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }],
    };
    const { calls } = mountCollection({ filter });
    await flushAll();
    expect(calls[0].filter).toEqual(await computeFilter(filter, 'user'));
  });

  it('displays count when displayCount is true', async () => {
    mountCollection({ displayCount: true });
    await flushAll();
    expect(wrapper.text()).toContain('results');
    expect(wrapper.text()).toContain('2');
  });

  it('makes rows clickable when onItemClick is set', async () => {
    const onItemClick = vi.fn();
    mountCollection({ onItemClick });
    await flushAll();
    const dataRow = wrapper.findAll('tbody tr').find((r) => r.attributes('tabindex') === '0');
    expect(dataRow).toBeTruthy();
    await dataRow!.trigger('click');
    expect(onItemClick).toHaveBeenCalledWith(sampleRows[0], expect.any(Event));
  });

  it('does not make rows clickable without onItemClick', async () => {
    mountCollection();
    await flushAll();
    const dataRow = wrapper.findAll('tbody tr').find((r) => r.attributes('tabindex') === '0');
    expect(dataRow).toBeUndefined();
  });

  it('shows export button when onExport is set, passing the computed empty group without filter', async () => {
    const onExport = vi.fn();
    mountCollection({ onExport });
    await flushAll();
    const exportButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('export'));
    expect(exportButton).toBeTruthy();
    await exportButton!.trigger('click');
    expect(onExport).toHaveBeenCalledWith({ type: 'group', operator: 'and', filters: [] });
  });

  it('does not show export button without onExport', async () => {
    mountCollection();
    await flushAll();
    const exportButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('export'));
    expect(exportButton).toBeUndefined();
  });

  describe('onExport filter argument', () => {
    const aliceFilter: Filter = {
      type: 'group',
      operator: 'and',
      filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }],
    };
    const smithFilter: Filter = {
      type: 'group',
      operator: 'and',
      filters: [{ type: 'condition', property: 'last_name', operator: '=', value: 'Smith' }],
    };

    function findExportButton() {
      return wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('export'));
    }

    it('passes the computed filter, not the raw one', async () => {
      const onExport = vi.fn();
      const filter: Filter = {
        type: 'group',
        operator: 'and',
        filters: [
          { type: 'condition', property: 'first_name', operator: 'begins_with', value: 'Al' },
          { type: 'condition', property: 'last_name', operator: '=', value: undefined },
        ],
      };
      mountCollection({ onExport, filter });
      await flushAll();
      await findExportButton()!.trigger('click');
      // begins_with rewritten to like 'Al%', empty condition stripped
      expect(onExport).toHaveBeenCalledWith(await computeFilter(filter, 'user'));
    });

    it('exports the last committed filter in manual mode, ignoring unvalidated edits', async () => {
      const onExport = vi.fn();
      mountCollection({ onExport, manual: true, filter: aliceFilter });
      await flushAll();
      await wrapper.setProps({ filter: smithFilter });
      await flushAll();
      await findExportButton()!.trigger('click');
      expect(onExport).toHaveBeenCalledWith(await computeFilter(aliceFilter, 'user'));
    });

    it('exports the new filter after submit() in manual mode', async () => {
      const onExport = vi.fn();
      mountCollection({ onExport, manual: true, filter: aliceFilter });
      await flushAll();
      await wrapper.setProps({ filter: smithFilter });
      (wrapper.vm as unknown as { submit: () => Promise<void> }).submit();
      await flushAll();
      await findExportButton()!.trigger('click');
      expect(onExport).toHaveBeenCalledWith(await computeFilter(smithFilter, 'user'));
    });

    it('exports the recomputed filter after an entity change in manual mode', async () => {
      const onExport = vi.fn();
      mountCollection({ onExport, manual: true, filter: aliceFilter });
      await flushAll();
      await wrapper.setProps({ entity: 'organization', fields: ['brand_name'], filter: undefined });
      await flushAll();
      await findExportButton()!.trigger('click');
      expect(onExport).toHaveBeenCalledWith({ type: 'group', operator: 'and', filters: [] });
    });

    it('disables the export button until the initial init settles', async () => {
      let releaseSchema!: () => void;
      const onExport = vi.fn();
      mountCollection({ onExport });
      // Swap the loader after mount but before the queued initial doInit resolves
      // the schema (it runs in a microtask): the init stalls on this promise.
      registerLoader({
        load: (id: string) =>
          new Promise((resolve) => {
            releaseSchema = () => resolve(entitySchemaLoader.load(id));
          }),
      });
      await flushAll();
      expect(findExportButton()!.attributes('disabled')).toBeDefined();

      releaseSchema();
      await flushAll();
      expect(findExportButton()!.attributes('disabled')).toBeUndefined();
    });

    it('disables the export button while the filter is invalid', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const onExport = vi.fn();
      mountCollection({ onExport, filter: aliceFilter });
      await flushAll();
      expect(findExportButton()!.attributes('disabled')).toBeUndefined();

      await wrapper.setProps({
        filter: {
          type: 'group',
          operator: 'and',
          filters: [
            {
              type: 'entity_condition',
              operator: 'has',
              property: 'unknown_property',
              filter: { type: 'condition', property: 'first_name', operator: '=', value: 'x' },
            } as EntityConditionFilter,
          ],
        },
      });
      await flushAll();
      expect(findExportButton()!.attributes('disabled')).toBeDefined();
      warn.mockRestore();
    });
  });

  it('shows InvalidField for invalid fields', async () => {
    mountCollection({ fields: ['first_name', 'nonexistent_col'] });
    await flushAll();
    expect(wrapper.text()).toContain('invalid column');
    expect(wrapper.text()).toContain('nonexistent_col');
  });

  it('shows FieldsEditor when editFields is true', async () => {
    mountCollection({ editFields: true });
    await flushAll();
    const columnsButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('columns'));
    expect(columnsButton).toBeTruthy();
  });

  it('does not show FieldsEditor when editFields is not set', async () => {
    mountCollection();
    await flushAll();
    const columnsButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('columns'));
    expect(columnsButton).toBeUndefined();
  });

  it('uses prop requester over global requester', async () => {
    const globalRequester = createMockRequester({ collection: [], count: 0 });
    registerRequester(globalRequester.requester);
    const { calls } = mountCollection();
    await flushAll();
    expect(calls).toHaveLength(1);
    expect(globalRequester.calls).toHaveLength(0);
  });

  it('calls postRequest after each request', async () => {
    const postRequest = vi.fn();
    mountCollection({ postRequest });
    await flushAll();
    expect(postRequest).toHaveBeenCalledWith(sampleRows);
  });

  it('includes field names as-is in request properties', async () => {
    const { calls } = mountCollection({ fields: ['first_name', 'age', 'company', 'metadata.label', 'unknown_prop'] });
    await flushAll();
    expect(calls[0].properties).toEqual(['first_name', 'age', 'company', 'metadata.label']);
  });

  it('updates static translations when locale changes', async () => {
    loadedTranslations['fr'] = fr;

    mountCollection({ displayCount: true });
    await flushAll();
    expect(wrapper.find('section').attributes('aria-label')).toBe('collection');

    locale.value = 'fr';
    await flushAll();
    expect(wrapper.find('section').attributes('aria-label')).toBe('collection'); // Same in both locales
    // Check 'results' translation
    expect(wrapper.find('caption').text()).toBe('résultats');
  });

  it('updates header translations when locale changes (schema translations)', async () => {
    await loadRawTranslations('user', 'fr');
    loadedTranslations['fr'] = fr;

    mountCollection({ fields: ['first_name'] });
    await flushAll();
    expect(wrapper.text()).toContain('first name');

    locale.value = 'fr';
    await flushAll();
    expect(wrapper.text()).toContain('prénom');
  });

  it('updates enum cell when locale changes (integration)', async () => {
    await loadRawTranslations('user', 'fr');
    loadedTranslations['fr'] = fr;

    mountCollection({ fields: ['gender'] }, { collection: [{ id: 1, gender: 'male' }], count: 1 });
    await flushAll();
    expect(wrapper.text()).toContain('Mr.');

    locale.value = 'fr';
    await flushAll();
    expect(wrapper.text()).toContain('M.');
  });

  describe('customFields', () => {
    it('renders custom field with open=true and label string', async () => {
      mountCollection({
        fields: ['custom_col'],
        customFields: { custom_col: { label: 'My Custom', open: true } },
      });
      await flushAll();
      expect(wrapper.text()).toContain('My Custom');
    });

    it('renders custom field with label function', async () => {
      mountCollection({
        fields: ['custom_col'],
        customFields: { custom_col: { label: (loc: string) => `Label-${loc}`, open: true } },
      });
      await flushAll();
      expect(wrapper.text()).toContain('Label-en');
    });

    it('renders custom field with renderer component', async () => {
      const CustomRenderer = markRaw(defineComponent({
        props: ['value'],
        render() {
          return h('em', `custom:${this.value}`);
        },
      }));
      mountCollection({
        fields: ['first_name'],
        customFields: { first_name: { label: 'First', renderer: CustomRenderer } },
      });
      await flushAll();
      expect(wrapper.find('em').text()).toBe('custom:John');
    });

    it('renders custom field with render function', async () => {
      const renderFn = (value: unknown) => `[${value}]`;
      mountCollection({
        fields: ['first_name'],
        customFields: { first_name: { label: 'First', renderer: renderFn } },
      });
      await flushAll();
      expect(wrapper.text()).toContain('[John]');
    });

    it('triggers onFieldClick on custom field click', async () => {
      const onFieldClick = vi.fn();
      mountCollection({
        fields: ['first_name'],
        customFields: { first_name: { label: 'First', onFieldClick } },
      });
      await flushAll();
      const clickableTd = wrapper.findAll('td').find((td) => td.attributes('role') === 'button');
      expect(clickableTd).toBeTruthy();
      await clickableTd!.trigger('click');
      expect(onFieldClick).toHaveBeenCalled();
    });

    it('uses custom order properties in sort request', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const sort = ref<any[]>([]);
      const { requester, calls } = createMockRequester({ collection: sampleRows, count: 2 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['custom_col'],
          'onUpdate:fields': () => {},
          requester,
          sort: sort.value,
          'onUpdate:sort': (v: any[]) => {
            sort.value = v;
            wrapper.setProps({ sort: v });
          },
          customFields: { custom_col: { label: 'Custom', open: true, sort: ['sort_field_a', 'sort_field_b'] } },
        },
      });
      await flushAll();

      const sortButton = wrapper.find('th button');
      expect(sortButton.exists()).toBe(true);
      await sortButton.trigger('click');
      await flushAll();
      vi.advanceTimersByTime(1000);
      await flushAll();

      expect(sort.value).toEqual([{ field: 'custom_col', order: 'asc' }]);
      const lastCall = calls[calls.length - 1];
      expect(lastCall.sort).toEqual([
        { property: 'sort_field_a', order: 'asc' },
        { property: 'sort_field_b', order: 'asc' },
      ]);
      vi.useRealTimers();
    });

    it('skips property resolution for open custom field', async () => {
      const { calls } = mountCollection({
        fields: ['virtual_col'],
        customFields: { virtual_col: { label: 'Virtual', open: true } },
      });
      await flushAll();
      // open field should not be included in properties (no schema property)
      expect(calls[0].properties).not.toContain('virtual_col');
    });

    it('declares additional properties for open field', async () => {
      const { calls } = mountCollection({
        fields: ['full_name'],
        customFields: {
          full_name: { label: 'Full Name', open: true, properties: ['first_name', 'last_name'] },
        },
      });
      await flushAll();
      expect(calls[0].properties).toEqual(['first_name', 'last_name']);
    });

    it('adds properties to property-bound field', async () => {
      const { calls } = mountCollection({
        fields: ['first_name'],
        customFields: {
          first_name: { label: 'Name', properties: ['gender'] },
        },
      });
      await flushAll();
      expect(calls[0].properties).toEqual(['first_name', 'gender']);
    });

    it('deduplicates properties', async () => {
      const { calls } = mountCollection({
        fields: ['first_name', 'age'],
        customFields: {
          age: { label: 'Age', properties: ['first_name'] },
        },
      });
      await flushAll();
      expect(calls[0].properties).toEqual(['first_name', 'age']);
    });

    it('supports nested paths in properties', async () => {
      const { calls } = mountCollection({
        fields: ['full_info'],
        customFields: {
          full_info: { label: 'Full Info', open: true, properties: ['company.brand_name', 'metadata.label'] },
        },
      });
      await flushAll();
      expect(calls[0].properties).toEqual(['company.brand_name', 'metadata.label']);
    });
  });

  describe('allowedCollectionTypes', () => {
    it('shows pagination by default', async () => {
      mountCollection();
      await flushAll();
      // Pagination renders navigation buttons (previous/next)
      const nav = wrapper.find('nav');
      expect(nav.exists()).toBe(true);
    });

    it('uses infinite scroll when allowedCollectionTypes is ["infinite"]', async () => {
      mountCollection({ allowedCollectionTypes: ['infinite'] });
      await flushAll();
      // No pagination nav
      const nav = wrapper.find('nav');
      expect(nav.exists()).toBe(false);
      // Sentinel row exists for IntersectionObserver
      const sentinel = wrapper.findAll('tbody tr').find((r) => r.attributes('style')?.includes('opacity: 0'));
      expect(sentinel).toBeTruthy();
    });

    it('shows toggle button when both types are allowed', async () => {
      mountCollection({ allowedCollectionTypes: ['pagination', 'infinite'] });
      await flushAll();
      const toggleButton = wrapper.findAll('button').find((b) => {
        const label = b.attributes('aria-label') ?? '';
        return label.includes('infinite') || label.includes('paginated');
      });
      expect(toggleButton).toBeTruthy();
    });

    it('does not show toggle button with single type', async () => {
      mountCollection({ allowedCollectionTypes: ['pagination'] });
      await flushAll();
      const toggleButton = wrapper.findAll('button').find((b) => {
        const label = b.attributes('aria-label') ?? '';
        return label.includes('infinite') || label.includes('paginated');
      });
      expect(toggleButton).toBeUndefined();
    });
  });

  describe('queryBuilderId', () => {
    it('renders skip link when queryBuilderId is set', async () => {
      mountCollection({ queryBuilderId: 'my-query-builder' });
      await flushAll();
      const skipLink = wrapper.find('a[href="#my-query-builder"]');
      expect(skipLink.exists()).toBe(true);
      expect(skipLink.text()).toBe('go to query builder');
    });

    it('does not render skip link without queryBuilderId', async () => {
      mountCollection();
      await flushAll();
      const skipLinks = wrapper.findAll('a').filter((a) => a.attributes('href')?.startsWith('#'));
      expect(skipLinks).toHaveLength(0);
    });
  });

  describe('config defaults and overrides', () => {
    it('uses global config defaults when no props are provided', async () => {
      mountCollection();
      await flushAll();
      const vm = wrapper.vm as any;
      expect(vm.config.userTimezone).toBe('UTC');
      expect(vm.config.requestTimezone).toBe('UTC');
      expect(vm.config.quickSort).toBe(true);
      expect(vm.config.displayCount).toBe(true);
      expect(vm.config.editFields).toBe(false);
      expect(vm.config.allowedCollectionTypes).toEqual(['pagination']);
    });

    it('overrides all config properties via props', async () => {
      mountCollection({
        userTimezone: 'Europe/Paris',
        requestTimezone: 'America/New_York',
        quickSort: false,
        displayCount: false,
        editFields: true,
        allowedCollectionTypes: ['infinite'],
      });
      await flushAll();
      const vm = wrapper.vm as any;
      expect(vm.config.userTimezone).toBe('Europe/Paris');
      expect(vm.config.requestTimezone).toBe('America/New_York');
      expect(vm.config.quickSort).toBe(false);
      expect(vm.config.displayCount).toBe(false);
      expect(vm.config.editFields).toBe(true);
      expect(vm.config.allowedCollectionTypes).toEqual(['infinite']);
    });
  });

  describe('sort handling', () => {
    it('initializes empty sort when sort is undefined', async () => {
      const { calls } = mountCollection();
      await flushAll();
      expect(calls).toHaveLength(1);
      expect(calls[0].sort).toBeUndefined();
    });
  });

  describe('infinite scroll toggle', () => {
    it('toggles from pagination to infinite scroll when button clicked', async () => {
      mountCollection({ allowedCollectionTypes: ['pagination', 'infinite'] });
      await flushAll();

      // Initially shows pagination
      expect(wrapper.find('nav').exists()).toBe(true);

      // Click the toggle button
      const toggleButton = wrapper.findAll('button').find((b) => {
        const label = b.attributes('aria-label') ?? '';
        return label.includes('infinite') || label.includes('paginated');
      });
      expect(toggleButton).toBeTruthy();
      await toggleButton!.trigger('click');
      await flushAll();

      // Should now be in infinite scroll mode - no pagination nav
      expect(wrapper.find('nav').exists()).toBe(false);
    });
  });

  describe('keyboard navigation on clickable rows', () => {
    it('handles Enter key on clickable row', async () => {
      const onItemClick = vi.fn();
      mountCollection({ onItemClick });
      await flushAll();

      const dataRow = wrapper.findAll('tbody tr').find((r) => r.attributes('tabindex') === '0');
      expect(dataRow).toBeTruthy();
      await dataRow!.trigger('keydown', { key: 'Enter' });
      expect(onItemClick).toHaveBeenCalledWith(sampleRows[0], expect.any(Event));
    });

    it('handles Space key on clickable row', async () => {
      const onItemClick = vi.fn();
      mountCollection({ onItemClick });
      await flushAll();

      const dataRow = wrapper.findAll('tbody tr').find((r) => r.attributes('tabindex') === '0');
      expect(dataRow).toBeTruthy();
      await dataRow!.trigger('keydown', { key: ' ' });
      expect(onItemClick).toHaveBeenCalledWith(sampleRows[0], expect.any(Event));
    });

    it('ignores other keys on clickable row', async () => {
      const onItemClick = vi.fn();
      mountCollection({ onItemClick });
      await flushAll();

      const dataRow = wrapper.findAll('tbody tr').find((r) => r.attributes('tabindex') === '0');
      await dataRow!.trigger('keydown', { key: 'Tab' });
      expect(onItemClick).not.toHaveBeenCalled();
    });
  });

  describe('infinite scroll behavior', () => {
    it('sets end when server returns fewer items than limit', async () => {
      const { requester } = createMockRequester({ collection: [sampleRows[0]], count: 1 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
          allowedCollectionTypes: ['infinite'],
        },
      });
      await flushAll();
      // With only 1 item returned when limit is 10, infinite scroll should reach the end
      // The observer sentinel should be hidden (v-show becomes false when end=true)
      const sentinel = wrapper.findAll('tbody tr').find((r) => r.attributes('style')?.includes('opacity: 0'));
      expect(sentinel).toBeTruthy();
      expect(sentinel!.isVisible()).toBe(false);
    });

    it('appends rows on subsequent pages instead of replacing', async () => {
      const page = ref(1);
      let callCount = 0;
      const requester = {
        request: vi.fn(async () => {
          callCount++;
          if (callCount === 1) {
            return { collection: [{ id: 1, first_name: 'A' }], count: 20, limit: 10 };
          }
          return { collection: [{ id: 2, first_name: 'B' }], count: 20, limit: 10 };
        }),
      };
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
          allowedCollectionTypes: ['infinite'],
          page: page.value,
          'onUpdate:page': (v: number) => {
            page.value = v;
            wrapper.setProps({ page: v });
          },
        },
      });
      await flushAll();
      expect(requester.request).toHaveBeenCalledTimes(1);

      // Simulate page increment (as IntersectionObserver would trigger)
      await wrapper.setProps({ page: 2 });
      await flushAll();
      expect(requester.request).toHaveBeenCalledTimes(2);
      // Both rows should be present (appended, not replaced)
      expect(wrapper.text()).toContain('A');
      expect(wrapper.text()).toContain('B');
    });

    it('chains page loads through the sentinel until the server runs out', async () => {
      const RealIntersectionObserver = globalThis.IntersectionObserver;
      let intersectCb: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
      globalThis.IntersectionObserver = class {
        constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
          intersectCb = cb;
        }
        observe() {}
        disconnect() {}
        unobserve() {}
        takeRecords() {
          return [];
        }
        root = null;
        rootMargin = '';
        thresholds = [];
      } as unknown as typeof IntersectionObserver;

      try {
        const pagesByNumber: Record<number, Record<string, unknown>[]> = {
          1: [{ id: 1, first_name: 'A' }],
          2: [{ id: 2, first_name: 'B' }],
          3: [{ id: 3, first_name: 'C' }],
          4: [],
        };
        const requester = {
          request: vi.fn(async ({ page }: { page: number }) => ({
            collection: pagesByNumber[page],
            count: 3,
            limit: 1,
          })),
        };
        wrapper = mountWithPlugin(Collection, {
          props: {
            entity: 'user',
            limit: 1,
            fields: ['first_name'],
            'onUpdate:fields': () => {},
            requester,
            allowedCollectionTypes: ['infinite'],
            page: 1,
            'onUpdate:page': (v: number) => {
              wrapper.setProps({ page: v });
            },
          },
        });
        await flushAll();
        expect(wrapper.text()).toContain('A');

        intersectCb!([{ isIntersecting: true }]);
        await flushAll();
        expect(wrapper.text()).toContain('B');

        intersectCb!([{ isIntersecting: true }]);
        await flushAll();
        expect(wrapper.text()).toContain('C');

        intersectCb!([{ isIntersecting: true }]);
        await flushAll();
        expect(requester.request.mock.calls.map(([params]) => params.page)).toEqual([1, 2, 3, 4]);

        // page 4 came back empty: end is reached, the sentinel must not trigger anymore
        intersectCb!([{ isIntersecting: true }]);
        await flushAll();
        expect(requester.request).toHaveBeenCalledTimes(4);
      } finally {
        globalThis.IntersectionObserver = RealIntersectionObserver;
      }
    });
  });

  describe('content contract', () => {
    it('marks the first load as replaced and appended pages as not replaced (infinite)', async () => {
      const { requester } = createMockRequester({ collection: sampleRows, count: 30 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 2,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
          allowedCollectionTypes: ['infinite'],
          page: 1,
          'onUpdate:page': () => {},
        },
      });
      await flushAll();
      const table = wrapper.findComponent(CollectionTable);
      const firstLoad = table.props('content');
      expect(firstLoad).toEqual({ collection: sampleRows, replaced: true });
      await wrapper.setProps({ page: 2 });
      await flushAll();
      const appended = table.props('content');
      expect(appended).not.toBe(firstLoad); // every update is a new wrapper
      expect(appended).toEqual({ collection: [...sampleRows, ...sampleRows], replaced: false });
    });

    it('marks a filter-driven reload as replaced', async () => {
      mountCollection({ filter: undefined, debounce: 0, allowedCollectionTypes: ['infinite'] });
      await flushAll();
      const table = wrapper.findComponent(CollectionTable);
      const firstLoad = table.props('content');
      expect(firstLoad.replaced).toBe(true);
      await wrapper.setProps({
        filter: {
          type: 'group',
          operator: 'and',
          filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }],
        } as Filter,
      });
      await flushAll();
      const reloaded = table.props('content');
      expect(reloaded).not.toBe(firstLoad);
      expect(reloaded.replaced).toBe(true);
    });

    it('marks a pagination page change as replaced (return to origin is delegated)', async () => {
      const { requester } = createMockRequester({ collection: sampleRows, count: 100 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
          page: 1,
          'onUpdate:page': () => {},
        },
      });
      await flushAll();
      const table = wrapper.findComponent(CollectionTable);
      const firstLoad = table.props('content');
      await wrapper.setProps({ page: 2 });
      await flushAll();
      const paged = table.props('content');
      expect(paged).not.toBe(firstLoad);
      expect(paged).toEqual({ collection: sampleRows, replaced: true });
    });

    it('keeps content untouched for a stale discarded response', async () => {
      const resolvers: Array<(v: unknown) => void> = [];
      const requester = { request: vi.fn(() => new Promise((resolve) => { resolvers.push(resolve); })) };
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
          page: 1,
          'onUpdate:page': () => {},
        },
      });
      await flushAll();
      await wrapper.setProps({ page: 2 });
      await flushAll();
      expect(resolvers).toHaveLength(2);
      const table = wrapper.findComponent(CollectionTable);
      const initial = table.props('content');

      resolvers[0]({ collection: [{ id: 99, first_name: 'Stale' }], count: 1, limit: 10 });
      await flushAll();
      expect(table.props('content')).toBe(initial); // discarded before the assignment

      resolvers[1]({ collection: [{ id: 1, first_name: 'Current' }], count: 1, limit: 10 });
      await flushAll();
      expect(table.props('content')).toEqual({ collection: [{ id: 1, first_name: 'Current' }], replaced: true });
    });
  });

  describe('stale request handling', () => {
    it('discards stale request response when a newer request has started', async () => {
      let resolvers: Array<(v: any) => void> = [];
      const requester = {
        request: vi.fn(() => new Promise((resolve) => { resolvers.push(resolve); })),
      };
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
          page: 1,
          'onUpdate:page': () => {},
        },
      });
      await flushAll();
      expect(resolvers).toHaveLength(1);

      // Trigger a second request by changing page
      await wrapper.setProps({ page: 2 });
      await flushAll();
      expect(resolvers).toHaveLength(2);

      // Resolve first request (stale) - should be discarded
      resolvers[0]({ collection: [{ id: 99, first_name: 'Stale' }], count: 1, limit: 10 });
      await flushAll();
      expect(wrapper.text()).not.toContain('Stale');

      // Resolve second request (current)
      resolvers[1]({ collection: [{ id: 1, first_name: 'Current' }], count: 1, limit: 10 });
      await flushAll();
      expect(wrapper.text()).toContain('Current');
    });

    it('keeps the requesting lock when an older response lands while a newer request waits in the queue', async () => {
      let releaseOrganization!: () => void;
      const resolvers: Array<(v: unknown) => void> = [];
      const requester = { request: vi.fn(() => new Promise((resolve) => { resolvers.push(resolve); })) };
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
          debounce: 0,
          page: 1,
          'onUpdate:page': () => {},
        },
      });
      await flushAll();
      expect(resolvers).toHaveLength(1); // request A in flight

      // Defer the organization schema so the filter init stalls the queue
      // (registered after mount: the plugin install re-registers the default loader)
      registerLoader({
        load: (name: string) =>
          name === 'organization'
            ? new Promise((r) => {
                releaseOrganization = () => r(entitySchemaLoader.load('organization'));
              })
            : entitySchemaLoader.load(name),
      });

      // Filter init stalls on the deferred organization schema
      await wrapper.setProps({
        filter: {
          type: 'group',
          operator: 'and',
          filters: [
            {
              type: 'entity_condition',
              operator: 'has',
              property: 'favorite_client',
              entities: ['organization'],
              filter: { type: 'condition', property: 'first_name', operator: '=', value: 'Alice' },
            } as EntityConditionFilter,
          ],
        },
      });
      // Request B enqueued behind the stalled init
      await wrapper.setProps({ page: 2 });
      // A lands while B still waits in the queue: the lock must hold
      resolvers[0]({ collection: sampleRows, count: 2, limit: 10 });
      await flushAll();
      expect(wrapper.find('.qkit-loading').exists()).toBe(true);

      releaseOrganization();
      await flushAll();
      expect(resolvers.length).toBeGreaterThanOrEqual(2);
      resolvers.slice(1).forEach((resolve) => resolve({ collection: sampleRows, count: 2, limit: 10 }));
      await flushAll();
      expect(wrapper.find('.qkit-loading').exists()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('throws when allowedCollectionTypes is empty', () => {
      expect(() => {
        mountCollection({ allowedCollectionTypes: [] });
      }).toThrow('allowedCollectionTypes prop must be not empty array');
    });

    it('throws when allowedCollectionTypes contains invalid type', () => {
      expect(() => {
        mountCollection({ allowedCollectionTypes: ['unknown' as any] });
      }).toThrow('invalide allowed collection type');
    });

    it('calls onRequestError and stops loading when the requester rejects', async () => {
      const onRequestError = vi.fn();
      const requester = { request: vi.fn().mockRejectedValue(new Error('network down')) };
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
          onRequestError,
        },
      });
      await flushAll();
      expect(onRequestError).toHaveBeenCalledTimes(1);
      expect(onRequestError.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(wrapper.find('.qkit-loading').exists()).toBe(false);
    });

    it('calls onRequestError when postRequest rejects', async () => {
      const onRequestError = vi.fn();
      const { requester } = createMockRequester({ collection: sampleRows, count: 2 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
          postRequest: () => Promise.reject(new Error('post failed')),
          onRequestError,
        },
      });
      await flushAll();
      expect(onRequestError).toHaveBeenCalledTimes(1);
    });

    it('calls onRequestError on an invalid response shape', async () => {
      const onRequestError = vi.fn();
      const requester = { request: vi.fn().mockResolvedValue({ not: 'a collection' }) };
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
          onRequestError,
        },
      });
      await flushAll();
      expect(onRequestError).toHaveBeenCalledTimes(1);
    });

    it('falls back to the globally registered request error handler', async () => {
      const globalHandler = vi.fn();
      registerRequestErrorHandler(globalHandler);
      const requester = { request: vi.fn().mockRejectedValue(new Error('boom')) };
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
        },
      });
      await flushAll();
      expect(globalHandler).toHaveBeenCalledTimes(1);
    });

    it('prefers the prop handler over the global one', async () => {
      const globalHandler = vi.fn();
      const propHandler = vi.fn();
      registerRequestErrorHandler(globalHandler);
      const requester = { request: vi.fn().mockRejectedValue(new Error('boom')) };
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
          onRequestError: propHandler,
        },
      });
      await flushAll();
      expect(propHandler).toHaveBeenCalledTimes(1);
      expect(globalHandler).not.toHaveBeenCalled();
    });

    it('does not throw an unhandled rejection when no onRequestError is given', async () => {
      const requester = { request: vi.fn().mockRejectedValue(new Error('boom')) };
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
        },
      });
      await flushAll();
      expect(wrapper.find('.qkit-loading').exists()).toBe(false);
    });

    // morph_to with a child filter but no entities → computeFilter throws
    const brokenFilter: Filter = {
      type: 'group',
      operator: 'and',
      filters: [
        {
          type: 'entity_condition',
          operator: 'has',
          property: 'favorite_client',
          filter: { type: 'condition', property: 'first_name', operator: '=', value: 'Alice' },
        } as EntityConditionFilter,
      ],
    };
    const validFilter: Filter = {
      type: 'group',
      operator: 'and',
      filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }],
    };

    it('shows InvalidEntity and does not request when the entity is unknown', async () => {
      const { calls } = mountCollection({ entity: 'nope' });
      await flushAll();
      expect(calls.length).toBe(0);
      expect(wrapper.text()).toContain('invalid entity');
      expect(wrapper.findComponent(CollectionTable).exists()).toBe(false);
    });

    it('recovers when the entity becomes valid', async () => {
      const { calls } = mountCollection({ entity: 'nope' });
      await flushAll();
      expect(calls.length).toBe(0);
      await wrapper.setProps({ entity: 'user' });
      await flushAll();
      expect(calls.length).toBe(1);
      expect(wrapper.findComponent(CollectionTable).exists()).toBe(true);
      expect(wrapper.text()).not.toContain('invalid entity');
    });

    it('blocks requests and shows an error when the filter never computed', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { calls } = mountCollection({ filter: brokenFilter, debounce: 0 });
      await flushAll();
      expect(warn).toHaveBeenCalled();
      expect(calls.length).toBe(0);
      expect(wrapper.text()).toContain('invalid filter, results cannot be displayed');
      expect(wrapper.findComponent(CollectionTable).exists()).toBe(false);
      warn.mockRestore();
    });

    it('recovers and requests once the filter computes successfully', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { calls } = mountCollection({ filter: brokenFilter, debounce: 0 });
      await flushAll();
      expect(calls.length).toBe(0);
      await wrapper.setProps({ filter: validFilter });
      await flushAll();
      expect(calls.length).toBe(1);
      expect(calls[0].filter).toEqual(await computeFilter(validFilter, 'user'));
      expect(wrapper.findComponent(CollectionTable).exists()).toBe(true);
      expect(wrapper.text()).not.toContain('invalid filter');
      warn.mockRestore();
    });

    it('shows the error and stops requesting when a later compute fails', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { calls } = mountCollection({ filter: validFilter, debounce: 0 });
      await flushAll();
      expect(calls.length).toBe(1);
      await wrapper.setProps({ filter: brokenFilter });
      await flushAll();
      expect(warn).toHaveBeenCalled();
      expect(calls.length).toBe(1);
      expect(wrapper.findComponent(CollectionTable).exists()).toBe(false);
      expect(wrapper.text()).toContain('invalid filter, results cannot be displayed');
      warn.mockRestore();
    });
  });

  describe('async postRequest', () => {
    it('awaits async postRequest before updating collection', async () => {
      let resolvePost!: () => void;
      const postRequest = vi.fn(() => new Promise<void>((r) => { resolvePost = r; }));
      mountCollection({ postRequest });
      await flushAll();
      expect(postRequest).toHaveBeenCalledWith(sampleRows);
      expect(wrapper.text()).not.toContain('John');
      resolvePost();
      await flushAll();
      expect(wrapper.text()).toContain('John');
    });
  });

  describe('requester function shorthand', () => {
    it('accepts a plain function as requester', async () => {
      const fn = vi.fn(async () => ({ collection: sampleRows, count: 2, limit: 25 }));
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester: fn,
        },
      });
      await flushAll();
      expect(fn).toHaveBeenCalledTimes(1);
      expect(wrapper.text()).toContain('John');
    });
  });

  describe('reloadCollection', () => {
    it('resets page to 1 when filter changes and page is not 1', async () => {
      const page = ref(1);
      const { requester, calls } = createMockRequester({ collection: sampleRows, count: 100 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
          page: page.value,
          'onUpdate:page': (v: number) => {
            page.value = v;
            wrapper.setProps({ page: v });
          },
          filter: undefined,
          debounce: 0,
        },
      });
      await flushAll();

      // Set page to 2
      await wrapper.setProps({ page: 2 });
      await flushAll();

      const callsBefore = calls.length;

      // Change filter (a real condition → computed filter changes) → reloadCollection → page back to 1
      await wrapper.setProps({
        filter: {
          type: 'group',
          operator: 'and',
          filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }],
        },
      });
      await flushAll();

      expect(page.value).toBe(1);
      expect(calls.length).toBeGreaterThan(callsBefore);
    });
  });

  describe('sort with relationship', () => {
    it('does not sort the server on an open custom field without a sort config, even when its id resolves', async () => {
      const { calls } = mountCollection({
        fields: ['first_name', 'age'],
        customFields: { age: { open: true } },
        sort: [{ field: 'age', order: 'desc' }],
        'onUpdate:sort': () => {},
      });
      await flushAll();
      expect(calls.length).toBe(1);
      expect(calls[0].sort).toBeUndefined();
    });

    it('treats a null sort as no sort', async () => {
      const { calls } = mountCollection({ sort: null as unknown as undefined, 'onUpdate:sort': () => {} });
      await flushAll();
      expect(calls.length).toBe(1);
      expect(calls[0].sort).toBeUndefined();
    });

    it('resolves object sort using natural_sort', async () => {
      const sort = ref<any[]>([{ field: 'metadata', order: 'asc' }]);
      const { requester, calls } = createMockRequester({ collection: sampleRows, count: 2 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['metadata'],
          'onUpdate:fields': () => {},
          requester,
          sort: sort.value,
          'onUpdate:sort': (v: any[]) => { sort.value = v; },
        },
      });
      await flushAll();
      // metadata entity has natural_sort: ['label']
      const lastCall = calls[calls.length - 1];
      expect(lastCall.sort).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ property: 'metadata.label', order: 'asc' }),
        ]),
      );
    });

    it('resolves relationship sort using unique_identifier fallback', async () => {
      const sort = ref<any[]>([{ field: 'company', order: 'asc' }]);
      const { requester, calls } = createMockRequester({ collection: sampleRows, count: 2 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['company'],
          'onUpdate:fields': () => {},
          requester,
          sort: sort.value,
          'onUpdate:sort': (v: any[]) => { sort.value = v; },
        },
      });
      await flushAll();
      // organization has no natural_sort → uses unique_identifier 'id'
      const lastCall = calls[calls.length - 1];
      expect(lastCall.sort).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ property: 'company.id', order: 'asc' }),
        ]),
      );
    });
  });

  describe('naturalSortWhenEmpty', () => {
    it('sends the entity natural_sort when sort is empty and the prop is true', async () => {
      const { calls } = mountCollection({ fields: ['first_name'], naturalSortWhenEmpty: true });
      await flushAll();
      expect(calls[0].sort).toEqual([
        { property: 'last_name', order: 'asc' },
        { property: 'first_name', order: 'asc' },
      ]);
    });

    it('sends no sort when sort is empty and the prop is false', async () => {
      const { calls } = mountCollection({ fields: ['first_name'] });
      await flushAll();
      expect(calls[0].sort).toBeUndefined();
    });

    it('does not write natural_sort back into the sort model (request-only)', async () => {
      const sort = ref<any[]>([]);
      const onUpdateSort = vi.fn((v: any[]) => { sort.value = v; });
      const { requester, calls } = createMockRequester({ collection: sampleRows, count: 2 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
          naturalSortWhenEmpty: true,
          sort: sort.value,
          'onUpdate:sort': onUpdateSort,
        },
      });
      await flushAll();
      expect(calls[0].sort).toEqual([
        { property: 'last_name', order: 'asc' },
        { property: 'first_name', order: 'asc' },
      ]);
      expect(onUpdateSort).not.toHaveBeenCalled();
      expect(sort.value).toEqual([]);
    });

    it('uses the explicit sort over natural_sort when sort is not empty', async () => {
      const sort = ref<any[]>([{ field: 'age', order: 'desc' }]);
      const { requester, calls } = createMockRequester({ collection: sampleRows, count: 2 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['age'],
          'onUpdate:fields': () => {},
          requester,
          naturalSortWhenEmpty: true,
          sort: sort.value,
          'onUpdate:sort': (v: any[]) => { sort.value = v; },
        },
      });
      await flushAll();
      expect(calls[0].sort).toEqual([{ property: 'age', order: 'desc' }]);
    });
  });

  describe('allowedCollectionTypes watcher', () => {
    it('preserves preferred mode when still allowed after change', async () => {
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester: createMockRequester({ collection: sampleRows, count: 2 }).requester,
          allowedCollectionTypes: ['pagination', 'infinite'],
        },
      });
      await flushAll();
      expect(wrapper.find('nav').exists()).toBe(true);

      // Switch to infinite
      const toggleButton = wrapper.findAll('button').find((b) => {
        const label = b.attributes('aria-label') ?? '';
        return label.includes('infinite') || label.includes('paginated');
      });
      await toggleButton!.trigger('click');
      await flushAll();
      expect(wrapper.find('nav').exists()).toBe(false);

      // Change order of allowedCollectionTypes but keep infinite → should stay infinite
      await wrapper.setProps({ allowedCollectionTypes: ['infinite', 'pagination'] });
      await flushAll();
      expect(wrapper.find('nav').exists()).toBe(false);
    });

    it('falls back when preferred mode is no longer allowed', async () => {
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester: createMockRequester({ collection: sampleRows, count: 2 }).requester,
          allowedCollectionTypes: ['pagination', 'infinite'],
        },
      });
      await flushAll();

      // Switch to infinite
      const toggleButton = wrapper.findAll('button').find((b) => {
        const label = b.attributes('aria-label') ?? '';
        return label.includes('infinite') || label.includes('paginated');
      });
      await toggleButton!.trigger('click');
      await flushAll();
      expect(wrapper.find('nav').exists()).toBe(false);

      // Remove infinite → should fall back to pagination
      await wrapper.setProps({ allowedCollectionTypes: ['pagination'] });
      await flushAll();
      expect(wrapper.find('nav').exists()).toBe(true);
    });
  });

  describe('multi-sort', () => {
    it('adds multiple sort columns with shift-click', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const sort = ref<any[]>([]);
      const { requester } = createMockRequester({ collection: sampleRows, count: 2 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name', 'last_name'],
          'onUpdate:fields': () => {},
          requester,
          sort: sort.value,
          'onUpdate:sort': (v: any[]) => {
            sort.value = v;
            wrapper.setProps({ sort: v });
          },
        },
      });
      await flushAll();

      const sortButtons = wrapper.findAll('th button');
      expect(sortButtons.length).toBe(2);

      // Click first header
      await sortButtons[0].trigger('click');
      vi.advanceTimersByTime(300);
      await flushAll();
      expect(sort.value).toEqual([{ field: 'first_name', order: 'asc' }]);

      // Ctrl-click second header (Header passes e.ctrlKey as multi flag)
      await sortButtons[1].trigger('click', { ctrlKey: true });
      vi.advanceTimersByTime(300);
      await flushAll();
      expect(sort.value).toHaveLength(2);
      expect(sort.value).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'first_name' }),
          expect.objectContaining({ field: 'last_name' }),
        ]),
      );
      vi.useRealTimers();
    });
  });

  describe('manual mode and debounce', () => {
    const simpleFilter: Filter = {
      type: 'group',
      operator: 'and',
      filters: [{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }],
    };

    it('does not request on filter change in manual mode', async () => {
      const { calls } = mountCollection({ manual: true, filter: undefined });
      await flushAll();
      const before = calls.length;
      await wrapper.setProps({ filter: simpleFilter });
      await flushAll();
      expect(calls.length).toBe(before);
    });

    it('does not request on sort change in manual mode', async () => {
      const { calls } = mountCollection({ manual: true });
      await flushAll();
      const before = calls.length;
      await wrapper.setProps({ sort: [{ field: 'first_name', order: 'asc' }] });
      await flushAll();
      expect(calls.length).toBe(before);
    });

    it('requests immediately on a fields edit from the collection UI even in manual mode', async () => {
      const { calls } = mountCollection({ manual: true, editFields: true });
      await flushAll();
      const before = calls.length;
      wrapper.findComponent(FieldsEditor).vm.$emit('update:modelValue', ['first_name']);
      await flushAll();
      expect(calls.length).toBe(before + 1);
    });

    it('submit() waits for the pending filter recompute before requesting', async () => {
      const { calls } = mountCollection({ manual: true, filter: undefined });
      await flushAll();
      const before = calls.length;
      await wrapper.setProps({ filter: simpleFilter });
      // No flush: the recompute queued by the watch is still in flight.
      (wrapper.vm as unknown as { submit: () => Promise<void> }).submit();
      await flushAll();
      expect(calls.length).toBe(before + 1);
      expect(calls[before].filter).toEqual(await computeFilter(simpleFilter, 'user'));
    });

    it('page change waits for the pending filter recompute before requesting', async () => {
      const { calls } = mountCollection({ manual: true, filter: undefined });
      await flushAll();
      const before = calls.length;
      await wrapper.setProps({ filter: simpleFilter });
      // No flush: the recompute queued by the watch is still in flight.
      await wrapper.setProps({ page: 2 });
      await flushAll();
      expect(calls.length).toBe(before + 1);
      expect(calls[before].page).toBe(2);
      expect(calls[before].filter).toEqual(await computeFilter(simpleFilter, 'user'));
    });

    it('a direct page request cancels the pending debounced reload (no yank back to page 1)', async () => {
      vi.useFakeTimers();
      const { calls } = mountCollection({ debounce: 1000, filter: undefined });
      await flushAll();
      const before = calls.length;
      await wrapper.setProps({ filter: simpleFilter }); // arms the debounced reload
      await flushAll();
      await wrapper.setProps({ page: 2 }); // direct request
      await flushAll();
      expect(calls.length).toBe(before + 1);
      expect(calls[before].page).toBe(2);
      vi.advanceTimersByTime(1000);
      await flushAll();
      expect(calls.length).toBe(before + 1); // no duplicate from the forgotten timer
      expect(wrapper.emitted('update:page') ?? []).not.toContainEqual([1]); // no yank
      vi.useRealTimers();
    });

    it('ignores reachedEnd while a debounced reload is pending (infinite)', async () => {
      vi.useFakeTimers();
      const { calls } = mountCollection(
        { debounce: 1000, filter: undefined, allowedCollectionTypes: ['infinite'] },
        { limit: 2 },
      );
      await flushAll();
      const before = calls.length;
      await wrapper.setProps({ filter: simpleFilter }); // arms the debounced reload
      await flushAll();
      wrapper.findComponent(CollectionTable).vm.$emit('reachedEnd');
      await flushAll();
      expect(calls.length).toBe(before); // append frozen during the debounce window
      vi.advanceTimersByTime(1000);
      await flushAll();
      expect(calls.length).toBe(before + 1); // the debounced reload owns the next request
      expect(calls[before].page).toBe(1);
      vi.useRealTimers();
    });

    it('requests immediately when submit() is called', async () => {
      const { calls } = mountCollection({ manual: true });
      await flushAll();
      const before = calls.length;
      (wrapper.vm as unknown as { submit: () => void }).submit();
      await flushAll();
      expect(calls.length).toBe(before + 1);
    });

    it('defers the request on filter change in auto mode (debounced, not immediate)', async () => {
      const { calls } = mountCollection({ filter: undefined });
      await flushAll();
      const before = calls.length;
      await wrapper.setProps({ filter: simpleFilter });
      await flushAll();
      expect(calls.length).toBe(before);
    });

    it('requests on filter change in auto mode with debounce 0', async () => {
      const { calls } = mountCollection({ filter: undefined, debounce: 0 });
      await flushAll();
      const before = calls.length;
      await wrapper.setProps({ filter: simpleFilter });
      await flushAll();
      expect(calls.length).toBe(before + 1);
    });

    it('does not request when a filter change computes to the same value (dedup)', async () => {
      const { calls } = mountCollection({ filter: undefined, debounce: 0 });
      await flushAll();
      const before = calls.length;
      // an empty group computes to the same as no filter → no request
      await wrapper.setProps({ filter: { type: 'group', operator: 'and', filters: [] } });
      await flushAll();
      expect(calls.length).toBe(before);
    });

    it('requests once (not twice) when fields are edited, despite the reactive v-model round-trip', async () => {
      // mirror a real v-model: a reactive parent state wraps the value, so it
      // bounces back as a reactive proxy (a different reference than the array
      // the child emitted) — toRaw must unwrap it for the echo skip to hold.
      const state = reactive<{ fields: string[] }>({ fields: ['first_name', 'last_name'] });
      const { requester, calls } = createMockRequester({ collection: sampleRows, count: 2 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          editFields: true,
          debounce: 0,
          fields: state.fields,
          'onUpdate:fields': (v: string[]) => {
            state.fields = v;
            wrapper.setProps({ fields: state.fields });
          },
          requester,
        },
      });
      await flushAll();
      const before = calls.length;
      wrapper.findComponent(FieldsEditor).vm.$emit('update:modelValue', ['first_name']);
      await flushAll();
      expect(calls.length).toBe(before + 1);
    });

    it('defers the request on a parent sort change (debounced)', async () => {
      const sort = ref<any[]>([]);
      const { requester, calls } = createMockRequester({ collection: sampleRows, count: 2 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
          sort: sort.value,
          'onUpdate:sort': (v: any[]) => { sort.value = v; wrapper.setProps({ sort: v }); },
        },
      });
      await flushAll();
      const before = calls.length;
      await wrapper.setProps({ sort: [{ field: 'first_name', order: 'asc' }] });
      await flushAll();
      expect(calls.length).toBe(before);
    });

    it('requests immediately on a child sort change (header click, after the 300ms coalesce)', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const sort = ref<any[]>([]);
      const { requester, calls } = createMockRequester({ collection: sampleRows, count: 2 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
          sort: sort.value,
          'onUpdate:sort': (v: any[]) => { sort.value = v; wrapper.setProps({ sort: v }); },
        },
      });
      await flushAll();
      const before = calls.length;
      await wrapper.find('th button').trigger('click');
      vi.advanceTimersByTime(300);
      await flushAll();
      expect(calls.length).toBe(before + 1);
      vi.useRealTimers();
    });

    it('requests the child-emitted sort even when the parent commits asynchronously', async () => {
      const { requester, calls } = createMockRequester({ collection: sampleRows, count: 2 });
      const sortRef = ref<any[]>([]);
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
          debounce: 0,
          sort: sortRef.value,
          // async commit: parent writes the v-model back only on the next macrotask
          'onUpdate:sort': (v: any[]) => { setTimeout(() => { sortRef.value = v; wrapper.setProps({ sort: v }); }, 0); },
        },
      });
      await flushAll();
      const before = calls.length;
      wrapper.findComponent(CollectionTable).vm.$emit('update:sort', [{ field: 'first_name', order: 'desc' }]);
      await flushAll();
      expect(calls.length).toBe(before + 1);
      expect(calls[before].sort).toEqual([{ property: 'first_name', order: 'desc' }]);
    });

    it('requests the child-emitted fields even when the parent commits asynchronously', async () => {
      const { requester, calls } = createMockRequester({ collection: sampleRows, count: 2 });
      const fieldsRef = ref<string[]>(['first_name', 'last_name']);
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          editFields: true,
          debounce: 0,
          fields: fieldsRef.value,
          'onUpdate:fields': (v: string[]) => { setTimeout(() => { fieldsRef.value = v; wrapper.setProps({ fields: v }); }, 0); },
          requester,
        },
      });
      await flushAll();
      const before = calls.length;
      wrapper.findComponent(FieldsEditor).vm.$emit('update:modelValue', ['first_name']);
      await flushAll();
      expect(calls.length).toBe(before + 1);
      expect(calls[before].properties).toEqual(['first_name']);
    });

    it('applies a parent restore that reuses a previously child-emitted sort reference', async () => {
      const arr1 = [{ field: 'first_name', order: 'asc' }];
      const arr2 = [{ field: 'first_name', order: 'desc' }];
      const sort = ref<any[]>([]);
      const { requester, calls } = createMockRequester({ collection: sampleRows, count: 2 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          fields: ['first_name'],
          'onUpdate:fields': () => {},
          requester,
          debounce: 0,
          sort: sort.value,
          'onUpdate:sort': (v: any[]) => { sort.value = v; wrapper.setProps({ sort: v }); },
        },
      });
      await flushAll();

      // Child emits arr1 → the echo latch records this exact reference
      wrapper.findComponent(CollectionTable).vm.$emit('update:sort', arr1);
      await flushAll();
      // Parent-driven change away to another reference
      await wrapper.setProps({ sort: arr2 });
      await flushAll();

      const before = calls.length;
      // Parent restores the exact arr1 reference (saved view / undo)
      await wrapper.setProps({ sort: arr1 });
      await flushAll();
      expect(calls.length).toBe(before + 1);
      expect(calls[before].sort).toEqual([{ property: 'first_name', order: 'asc' }]);
    });
  });
});
