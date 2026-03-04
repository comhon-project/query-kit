import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { defineComponent, h, markRaw, ref } from 'vue';
import Collection from '@components/Collection/Collection.vue';
import Cell from '@components/Collection/Cell.vue';
import { registerLoader, registerTranslationsLoader, loadRawTranslations } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { registerRequester } from '@core/Requester';
import { locale, loadedTranslations } from '@i18n/i18n';
import fr from '@i18n/locales/fr';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { flushAll } from '@tests/helpers/flushAsync';
import { createMockRequester } from '@tests/helpers/createMockRequester';
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

  const columns = ref(overrides.columns ?? ['first_name', 'last_name']);

  wrapper = mountWithPlugin(Collection, {
    props: {
      entity: 'user',
      limit: 10,
      columns: columns.value,
      'onUpdate:columns': (v: string[]) => { columns.value = v; },
      requester,
      ...overrides,
    },
  });

  return { requester, calls, columns };
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
        columns: ['first_name'],
        'onUpdate:columns': () => {},
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
    const orderBy = ref<any[]>([]);
    const { requester } = createMockRequester({ collection: sampleRows, count: 2 });
    wrapper = mountWithPlugin(Collection, {
      props: {
        entity: 'user',
        limit: 10,
        columns: ['first_name', 'last_name'],
        'onUpdate:columns': () => {},
        requester,
        orderBy: orderBy.value,
        'onUpdate:orderBy': (v: any[]) => { orderBy.value = v; },
      },
    });
    await flushAll();

    // Click sort on first_name header
    const sortButton = wrapper.find('th button');
    await sortButton.trigger('click');
    await flushAll();

    expect(orderBy.value).toEqual([{ column: 'first_name', order: 'asc' }]);
  });

  it('cycles sort order: undefined → asc → desc → undefined', async () => {
    const orderBy = ref<any[]>([]);
    const { requester } = createMockRequester({ collection: sampleRows, count: 2 });
    wrapper = mountWithPlugin(Collection, {
      props: {
        entity: 'user',
        limit: 10,
        columns: ['first_name'],
        'onUpdate:columns': () => {},
        requester,
        orderBy: orderBy.value,
        'onUpdate:orderBy': (v: any[]) => {
          orderBy.value = v;
          wrapper.setProps({ orderBy: v });
        },
      },
    });
    await flushAll();

    const sortButton = wrapper.find('th button');

    // First click → asc
    await sortButton.trigger('click');
    await flushAll();
    expect(orderBy.value).toEqual([{ column: 'first_name', order: 'asc' }]);

    // Second click → desc
    await sortButton.trigger('click');
    await flushAll();
    expect(orderBy.value).toEqual([{ column: 'first_name', order: 'desc' }]);

    // Third click → removed
    await sortButton.trigger('click');
    await flushAll();
    expect(orderBy.value).toEqual([]);
  });

  it('passes filter to requester', async () => {
    const filter = { type: 'and', operator: 'and', children: [] };
    const { calls } = mountCollection({ filter });
    await flushAll();
    expect(calls[0].filter).toEqual(filter);
  });

  it('displays count when displayCount is true', async () => {
    mountCollection({ displayCount: true });
    await flushAll();
    expect(wrapper.text()).toContain('results');
    expect(wrapper.text()).toContain('2');
  });

  it('makes rows clickable when onRowClick is set', async () => {
    const onRowClick = vi.fn();
    mountCollection({ onRowClick });
    await flushAll();
    const dataRow = wrapper.findAll('tbody tr').find((r) => r.attributes('tabindex') === '0');
    expect(dataRow).toBeTruthy();
    await dataRow!.trigger('click');
    expect(onRowClick).toHaveBeenCalledWith(sampleRows[0], expect.any(Event));
  });

  it('does not make rows clickable without onRowClick', async () => {
    mountCollection();
    await flushAll();
    const dataRow = wrapper.findAll('tbody tr').find((r) => r.attributes('tabindex') === '0');
    expect(dataRow).toBeUndefined();
  });

  it('shows export button when onExport is set', async () => {
    const onExport = vi.fn();
    mountCollection({ onExport });
    await flushAll();
    const exportButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('export'));
    expect(exportButton).toBeTruthy();
    await exportButton!.trigger('click');
    expect(onExport).toHaveBeenCalled();
  });

  it('does not show export button without onExport', async () => {
    mountCollection();
    await flushAll();
    const exportButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('export'));
    expect(exportButton).toBeUndefined();
  });

  it('shows InvalidColumn for invalid columns', async () => {
    mountCollection({ columns: ['first_name', 'nonexistent_col'] });
    await flushAll();
    expect(wrapper.text()).toContain('invalid column');
    expect(wrapper.text()).toContain('nonexistent_col');
  });

  it('shows ColumnEditor when editColumns is true', async () => {
    mountCollection({ editColumns: true });
    await flushAll();
    const columnsButton = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('columns'));
    expect(columnsButton).toBeTruthy();
  });

  it('does not show ColumnEditor when editColumns is not set', async () => {
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

  it('includes relationship properties (unique_identifier + primary_identifiers) in request', async () => {
    const { calls } = mountCollection({ columns: ['company'] });
    await flushAll();
    // company is belongs_to organization: unique_identifier=id, primary_identifiers=[brand_name]
    expect(calls[0].properties).toContain('company.id');
    expect(calls[0].properties).toContain('company.brand_name');
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

    mountCollection({ columns: ['first_name'] });
    await flushAll();
    expect(wrapper.text()).toContain('first name');

    locale.value = 'fr';
    await flushAll();
    expect(wrapper.text()).toContain('prénom');
  });

  it('updates enum cell when locale changes (integration)', async () => {
    await loadRawTranslations('user', 'fr');
    loadedTranslations['fr'] = fr;

    mountCollection({ columns: ['gender'] }, { collection: [{ id: 1, gender: 'male' }], count: 1 });
    await flushAll();
    expect(wrapper.text()).toContain('Mr.');

    locale.value = 'fr';
    await flushAll();
    expect(wrapper.text()).toContain('M.');
  });

  describe('customColumns', () => {
    it('renders custom column with open=true and label string', async () => {
      mountCollection({
        columns: ['custom_col'],
        customColumns: { custom_col: { label: 'My Custom', open: true } },
      });
      await flushAll();
      expect(wrapper.text()).toContain('My Custom');
    });

    it('renders custom column with label function', async () => {
      mountCollection({
        columns: ['custom_col'],
        customColumns: { custom_col: { label: (loc: string) => `Label-${loc}`, open: true } },
      });
      await flushAll();
      expect(wrapper.text()).toContain('Label-en');
    });

    it('renders custom column with renderer component', async () => {
      const CustomRenderer = markRaw(defineComponent({
        props: ['value'],
        render() {
          return h('em', `custom:${this.value}`);
        },
      }));
      mountCollection({
        columns: ['first_name'],
        customColumns: { first_name: { label: 'First', renderer: CustomRenderer } },
      });
      await flushAll();
      expect(wrapper.find('em').text()).toBe('custom:John');
    });

    it('renders custom column with render function', async () => {
      const renderFn = (value: unknown) => `[${value}]`;
      mountCollection({
        columns: ['first_name'],
        customColumns: { first_name: { label: 'First', renderer: renderFn } },
      });
      await flushAll();
      expect(wrapper.text()).toContain('[John]');
    });

    it('triggers onCellClick on custom column cell click', async () => {
      const onCellClick = vi.fn();
      mountCollection({
        columns: ['first_name'],
        customColumns: { first_name: { label: 'First', onCellClick } },
      });
      await flushAll();
      const clickableTd = wrapper.findAll('td').find((td) => td.attributes('role') === 'button');
      expect(clickableTd).toBeTruthy();
      await clickableTd!.trigger('click');
      expect(onCellClick).toHaveBeenCalled();
    });

    it('uses custom order properties in sort request', async () => {
      const orderBy = ref<any[]>([]);
      const { requester, calls } = createMockRequester({ collection: sampleRows, count: 2 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          columns: ['custom_col'],
          'onUpdate:columns': () => {},
          requester,
          orderBy: orderBy.value,
          'onUpdate:orderBy': (v: any[]) => {
            orderBy.value = v;
            wrapper.setProps({ orderBy: v });
          },
          customColumns: { custom_col: { label: 'Custom', open: true, order: ['sort_field_a', 'sort_field_b'] } },
        },
      });
      await flushAll();

      const sortButton = wrapper.find('th button');
      expect(sortButton.exists()).toBe(true);
      await sortButton.trigger('click');
      await flushAll();
      await flushAll();

      expect(orderBy.value).toEqual([{ column: 'custom_col', order: 'asc' }]);
      const lastCall = calls[calls.length - 1];
      expect(lastCall.order).toEqual([
        { property: 'sort_field_a', order: 'asc' },
        { property: 'sort_field_b', order: 'asc' },
      ]);
    });

    it('skips property resolution for open custom column', async () => {
      const { calls } = mountCollection({
        columns: ['virtual_col'],
        customColumns: { virtual_col: { label: 'Virtual', open: true } },
      });
      await flushAll();
      // open column should not be included in properties (no schema property)
      expect(calls[0].properties).not.toContain('virtual_col');
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

  describe('builderId', () => {
    it('renders skip link when builderId is set', async () => {
      mountCollection({ builderId: 'my-filter' });
      await flushAll();
      const skipLink = wrapper.find('a[href="#my-filter"]');
      expect(skipLink.exists()).toBe(true);
      expect(skipLink.text()).toBe('go to filter');
    });

    it('does not render skip link without builderId', async () => {
      mountCollection();
      await flushAll();
      const skipLinks = wrapper.findAll('a').filter((a) => a.attributes('href')?.startsWith('#'));
      expect(skipLinks).toHaveLength(0);
    });
  });

  describe('timezone props', () => {
    it('passes userTimezone and requestTimezone to Cell components', async () => {
      mountCollection({ userTimezone: 'Europe/Paris', requestTimezone: 'America/New_York' });
      await flushAll();
      const cells = wrapper.findAllComponents(Cell);
      expect(cells.length).toBeGreaterThan(0);
      expect(cells[0].props('userTimezone')).toBe('Europe/Paris');
      expect(cells[0].props('requestTimezone')).toBe('America/New_York');
    });

    it('defaults timezones to UTC', async () => {
      mountCollection();
      await flushAll();
      const cells = wrapper.findAllComponents(Cell);
      expect(cells.length).toBeGreaterThan(0);
      expect(cells[0].props('userTimezone')).toBe('UTC');
      expect(cells[0].props('requestTimezone')).toBe('UTC');
    });
  });

  describe('orderBy handling', () => {
    it('initializes empty orderBy when orderBy is undefined', async () => {
      const { calls } = mountCollection();
      await flushAll();
      expect(calls).toHaveLength(1);
      expect(calls[0].order).toBeUndefined();
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
      const onRowClick = vi.fn();
      mountCollection({ onRowClick });
      await flushAll();

      const dataRow = wrapper.findAll('tbody tr').find((r) => r.attributes('tabindex') === '0');
      expect(dataRow).toBeTruthy();
      await dataRow!.trigger('keydown', { key: 'Enter' });
      expect(onRowClick).toHaveBeenCalledWith(sampleRows[0], expect.any(Event));
    });

    it('handles Space key on clickable row', async () => {
      const onRowClick = vi.fn();
      mountCollection({ onRowClick });
      await flushAll();

      const dataRow = wrapper.findAll('tbody tr').find((r) => r.attributes('tabindex') === '0');
      expect(dataRow).toBeTruthy();
      await dataRow!.trigger('keydown', { key: ' ' });
      expect(onRowClick).toHaveBeenCalledWith(sampleRows[0], expect.any(Event));
    });

    it('ignores other keys on clickable row', async () => {
      const onRowClick = vi.fn();
      mountCollection({ onRowClick });
      await flushAll();

      const dataRow = wrapper.findAll('tbody tr').find((r) => r.attributes('tabindex') === '0');
      await dataRow!.trigger('keydown', { key: 'Tab' });
      expect(onRowClick).not.toHaveBeenCalled();
    });
  });

  describe('flattened requester', () => {
    it('detects flattened requester correctly', async () => {
      const { requester: flatRequester } = createMockRequester({ collection: sampleRows, count: 2 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          columns: ['first_name'],
          'onUpdate:columns': () => {},
          requester: { request: (flatRequester as any).request, flattened: true },
        },
      });
      await flushAll();

      const cells = wrapper.findAllComponents(Cell);
      expect(cells.length).toBeGreaterThan(0);
      expect(cells[0].props('flattened')).toBe(true);
    });
  });

  describe('infinite scroll behavior', () => {
    it('sets end when server returns fewer items than limit', async () => {
      const { requester } = createMockRequester({ collection: [sampleRows[0]], count: 1 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          columns: ['first_name'],
          'onUpdate:columns': () => {},
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
            return { collection: [{ id: 1, first_name: 'A' }], count: 20 };
          }
          return { collection: [{ id: 2, first_name: 'B' }], count: 20 };
        }),
      };
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          columns: ['first_name'],
          'onUpdate:columns': () => {},
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
          columns: ['first_name'],
          'onUpdate:columns': () => {},
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
      resolvers[0]({ collection: [{ id: 99, first_name: 'Stale' }], count: 1 });
      await flushAll();
      expect(wrapper.text()).not.toContain('Stale');

      // Resolve second request (current)
      resolvers[1]({ collection: [{ id: 1, first_name: 'Current' }], count: 1 });
      await flushAll();
      expect(wrapper.text()).toContain('Current');
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
  });

  describe('async postRequest', () => {
    it('awaits async postRequest before updating collection', async () => {
      const order: string[] = [];
      const postRequest = vi.fn(async () => {
        order.push('postRequest');
        await new Promise((r) => setTimeout(r, 0));
        order.push('postRequestDone');
      });
      mountCollection({ postRequest });
      await flushAll();
      expect(postRequest).toHaveBeenCalled();
      expect(order).toEqual(['postRequest', 'postRequestDone']);
    });
  });

  describe('requester function shorthand', () => {
    it('accepts a plain function as requester', async () => {
      const fn = vi.fn(async () => ({ collection: sampleRows, count: 2 }));
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          columns: ['first_name'],
          'onUpdate:columns': () => {},
          requester: fn,
        },
      });
      await flushAll();
      expect(fn).toHaveBeenCalledTimes(1);
      expect(wrapper.text()).toContain('John');
    });
  });

  describe('resetCollection', () => {
    it('resets page to 1 when filter changes and page is not 1', async () => {
      const page = ref(1);
      const { requester, calls } = createMockRequester({ collection: sampleRows, count: 100 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          columns: ['first_name'],
          'onUpdate:columns': () => {},
          requester,
          page: page.value,
          'onUpdate:page': (v: number) => {
            page.value = v;
            wrapper.setProps({ page: v });
          },
          filter: undefined,
        },
      });
      await flushAll();

      // Set page to 2
      await wrapper.setProps({ page: 2 });
      await flushAll();

      const callsBefore = calls.length;

      // Change filter triggers resetCollection, which should reset page to 1
      await wrapper.setProps({ filter: { type: 'group', operator: 'and', filters: [] } });
      await flushAll();

      expect(page.value).toBe(1);
      expect(calls.length).toBeGreaterThan(callsBefore);
    });
  });

  describe('orderBy with relationship', () => {
    it('resolves relationship sort using unique_identifier fallback', async () => {
      const orderBy = ref<any[]>([{ column: 'company', order: 'asc' }]);
      const { requester, calls } = createMockRequester({ collection: sampleRows, count: 2 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          columns: ['company'],
          'onUpdate:columns': () => {},
          requester,
          orderBy: orderBy.value,
          'onUpdate:orderBy': (v: any[]) => { orderBy.value = v; },
        },
      });
      await flushAll();
      // organization has no default_sort → uses unique_identifier 'id'
      const lastCall = calls[calls.length - 1];
      expect(lastCall.order).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ property: 'company.id', order: 'asc' }),
        ]),
      );
    });
  });

  describe('allowedCollectionTypes watcher', () => {
    it('preserves preferred mode when still allowed after change', async () => {
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          columns: ['first_name'],
          'onUpdate:columns': () => {},
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
          columns: ['first_name'],
          'onUpdate:columns': () => {},
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
      const orderBy = ref<any[]>([]);
      const { requester } = createMockRequester({ collection: sampleRows, count: 2 });
      wrapper = mountWithPlugin(Collection, {
        props: {
          entity: 'user',
          limit: 10,
          columns: ['first_name', 'last_name'],
          'onUpdate:columns': () => {},
          requester,
          orderBy: orderBy.value,
          'onUpdate:orderBy': (v: any[]) => {
            orderBy.value = v;
            wrapper.setProps({ orderBy: v });
          },
        },
      });
      await flushAll();

      const sortButtons = wrapper.findAll('th button');
      expect(sortButtons.length).toBe(2);

      // Click first header
      await sortButtons[0].trigger('click');
      await flushAll();
      expect(orderBy.value).toEqual([{ column: 'first_name', order: 'asc' }]);

      // Ctrl-click second header (Header passes e.ctrlKey as multi flag)
      await sortButtons[1].trigger('click', { ctrlKey: true });
      await flushAll();
      expect(orderBy.value).toHaveLength(2);
      expect(orderBy.value).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ column: 'first_name' }),
          expect.objectContaining({ column: 'last_name' }),
        ]),
      );
    });
  });
});
