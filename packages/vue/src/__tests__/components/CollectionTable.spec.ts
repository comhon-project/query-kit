import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CollectionTable from '@components/Collection/CollectionTable.vue';
import { resolve, registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { flushAll } from '@tests/helpers/flushAsync';
import type { EntitySchema, Property } from '@core/EntitySchema';
import type { VueWrapper } from '@vue/test-utils';

let userSchema: EntitySchema;
let wrapper: VueWrapper;
let intersectCb: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
let observeCount = 0;
let unobserveCount = 0;
const RealIntersectionObserver = globalThis.IntersectionObserver;

const rows = [
  { id: 1, first_name: 'John', last_name: 'Doe' },
  { id: 2, first_name: 'Jane', last_name: 'Smith' },
];
const fieldsProperties: Record<string, Property | undefined> = {
  first_name: { id: 'first_name', type: 'string', owner: 'user' } as Property,
  last_name: { id: 'last_name', type: 'string', owner: 'user' } as Property,
};

function content(
  collection: Record<string, unknown>[],
  replaced = false,
  fields: Record<string, Property | undefined> = fieldsProperties,
) {
  return { collection, fieldsProperties: fields, replaced };
}

function mountTable(overrides: Record<string, unknown> = {}) {
  const { fieldsProperties: fieldsOverride, content: contentOverride, ...rest } = overrides as {
    fieldsProperties?: Record<string, Property | undefined>;
    content?: ReturnType<typeof content>;
  } & Record<string, unknown>;
  wrapper = mountWithPlugin(CollectionTable, {
    props: {
      content: contentOverride ?? content(rows, false, fieldsOverride ?? fieldsProperties),
      sort: [],
      entitySchema: userSchema,
      userTimezone: 'UTC',
      requestTimezone: 'UTC',
      ...rest,
    },
  });
  return wrapper;
}

beforeEach(async () => {
  registerLoader(entitySchemaLoader);
  registerTranslationsLoader(entityTranslationsLoader);
  registerRequestLoader(requestSchemaLoader);
  userSchema = await resolve('user');
  intersectCb = undefined;
  observeCount = 0;
  unobserveCount = 0;
  globalThis.IntersectionObserver = class {
    constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
      intersectCb = cb;
    }
    observe() {
      observeCount++;
    }
    disconnect() {}
    unobserve() {
      unobserveCount++;
    }
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = '';
    thresholds = [];
  } as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  wrapper?.unmount();
  globalThis.IntersectionObserver = RealIntersectionObserver;
});

describe('CollectionTable', () => {
  it('renders a header per field and the cell values per row', async () => {
    mountTable();
    await flushAll();
    expect(wrapper.findAll('th')).toHaveLength(2);
    expect(wrapper.text()).toContain('John');
    expect(wrapper.text()).toContain('Smith');
  });

  it('emits a debounced update:sort on header click, coalescing rapid clicks', async () => {
    vi.useFakeTimers();
    mountTable();
    await flushAll();

    await wrapper.find('th button').trigger('click'); // → asc
    await wrapper.find('th button').trigger('click'); // → desc (within the 300ms window)
    expect(wrapper.emitted('update:sort')).toBeUndefined();

    vi.advanceTimersByTime(300);
    await flushAll();

    const emits = wrapper.emitted('update:sort');
    expect(emits).toHaveLength(1);
    expect(emits![0][0]).toEqual([{ field: 'first_name', order: 'desc' }]);
    vi.useRealTimers();
  });

  it('does not show a sort arrow for an open custom field the request drops', async () => {
    mountTable({
      fieldsProperties: { ...fieldsProperties, actions: undefined },
      customFields: { actions: { open: true } },
      sort: [{ field: 'actions', order: 'asc' }, { field: 'first_name', order: 'desc' }],
    });
    await flushAll();
    const sorted = wrapper.findAll('th').filter((th) => ['ascending', 'descending'].includes(th.attributes('aria-sort')!));
    expect(sorted).toHaveLength(1);
    expect(sorted[0].attributes('aria-sort')).toBe('descending');
    expect(sorted[0].text()).toContain('first name');
  });

  it('shows a sort arrow for a custom field with a custom sort config', async () => {
    mountTable({
      fieldsProperties: { ...fieldsProperties, total: undefined },
      customFields: { total: { open: true, sort: ['age'], label: 'Total' } },
      sort: [{ field: 'total', order: 'asc' }],
    });
    await flushAll();
    const sorted = wrapper.findAll('th').filter((th) => ['ascending', 'descending'].includes(th.attributes('aria-sort')!));
    expect(sorted).toHaveLength(1);
    expect(sorted[0].attributes('aria-sort')).toBe('ascending');
    expect(sorted[0].text()).toContain('Total');
  });

  it('resolves each column label and passes it to every body cell when reflowing', async () => {
    mountTable({ reflow: true });
    await flushAll();
    const cellLabels = wrapper.findAll('tbody td .qkit-cell-label').map((label) => label.text());
    // 2 rows × [first_name, last_name], each cell carrying its resolved column label
    expect(cellLabels).toEqual(['first name', 'last name', 'first name', 'last name']);
  });

  it('adds ARIA table roles when reflowing', async () => {
    mountTable({ reflow: true });
    await flushAll();
    expect(wrapper.find('table').attributes('role')).toBe('table');
    expect(wrapper.find('thead').attributes('role')).toBe('rowgroup');
    expect(wrapper.find('tbody').attributes('role')).toBe('rowgroup');
    expect(wrapper.find('thead tr').attributes('role')).toBe('row');
    expect(wrapper.find('th').attributes('role')).toBe('columnheader');
    expect(wrapper.find('tbody td').attributes('role')).toBe('cell');
  });

  it('adds no ARIA table roles when not reflowing', async () => {
    mountTable({ reflow: false });
    await flushAll();
    expect(wrapper.find('table').attributes('role')).toBeUndefined();
    expect(wrapper.find('thead').attributes('role')).toBeUndefined();
    expect(wrapper.find('th').attributes('role')).toBeUndefined();
    expect(wrapper.find('tbody td').attributes('role')).toBeUndefined();
  });

  it('emits reachedEnd when the sentinel intersects', async () => {
    mountTable();
    await flushAll();
    expect(intersectCb).toBeDefined();
    intersectCb!([{ isIntersecting: true }]);
    expect(wrapper.emitted('reachedEnd')).toHaveLength(1);
  });

  it('does not emit reachedEnd when the sentinel is not intersecting', async () => {
    mountTable();
    await flushAll();
    intersectCb!([{ isIntersecting: false }]);
    expect(wrapper.emitted('reachedEnd')).toBeUndefined();
  });

  it('acts on the most recent entry when one delivery coalesces several transitions', async () => {
    mountTable();
    await flushAll();
    intersectCb!([{ isIntersecting: true }, { isIntersecting: false }]);
    expect(wrapper.emitted('reachedEnd')).toBeUndefined();
    intersectCb!([{ isIntersecting: false }, { isIntersecting: true }]);
    expect(wrapper.emitted('reachedEnd')).toHaveLength(1);
  });

  it('re-observes the sentinel on an appended update when the container is not scrolled', async () => {
    mountTable();
    await flushAll();
    const observeBefore = observeCount;
    const unobserveBefore = unobserveCount;
    await wrapper.setProps({ content: content([...rows, { id: 3, first_name: 'Bob', last_name: 'Lee' }]) });
    await flushAll();
    expect(unobserveCount).toBe(unobserveBefore + 1);
    expect(observeCount).toBe(observeBefore + 1);
  });

  it('re-observes on a new content wrapper even holding the same collection array', async () => {
    mountTable();
    await flushAll();
    const observeBefore = observeCount;
    const unobserveBefore = unobserveCount;
    await wrapper.setProps({ content: content(rows) });
    await flushAll();
    expect(unobserveCount).toBe(unobserveBefore + 1);
    expect(observeCount).toBe(observeBefore + 1);
  });

  it('does not re-observe when the scroll container is scrolled (content overflows)', async () => {
    mountTable();
    await flushAll();
    wrapper.find('table').element.parentElement!.scrollTop = 100;
    const observeBefore = observeCount;
    const unobserveBefore = unobserveCount;
    await wrapper.setProps({ content: content([...rows, { id: 3, first_name: 'Bob', last_name: 'Lee' }]) });
    await flushAll();
    expect(unobserveCount).toBe(unobserveBefore);
    expect(observeCount).toBe(observeBefore);
  });

  it('keys rows by the entity unique identifier so reordering moves DOM rows', async () => {
    mountTable();
    await flushAll();
    const johnRowBefore = wrapper.findAll('tbody tr')[0].element;
    expect(johnRowBefore.textContent).toContain('John');
    await wrapper.setProps({ content: content([rows[1], rows[0]]) });
    const dataRows = wrapper.findAll('tbody tr');
    expect(dataRows[0].element.textContent).toContain('Jane');
    expect(dataRows[1].element).toBe(johnRowBefore);
  });

  it('falls back to the row index as key when the identifier is missing', async () => {
    mountTable({ content: content([{ first_name: 'NoId', last_name: 'One' }]) });
    await flushAll();
    expect(wrapper.text()).toContain('NoId');
  });

  it('makes rows clickable and calls onRowClick with the row', async () => {
    const onRowClick = vi.fn();
    mountTable({ onRowClick });
    await flushAll();
    const dataRow = wrapper.findAll('tbody tr').find((r) => r.attributes('tabindex') === '0');
    expect(dataRow).toBeTruthy();
    await dataRow!.trigger('click');
    expect(onRowClick).toHaveBeenCalledWith(rows[0], expect.any(Event));
  });

  it('does not make rows clickable without onRowClick', async () => {
    mountTable();
    await flushAll();
    const dataRow = wrapper.findAll('tbody tr').find((r) => r.attributes('tabindex') === '0');
    expect(dataRow).toBeUndefined();
  });

  describe('replacement handling (content.replaced)', () => {
    function scrollContainer(): HTMLElement {
      return wrapper.find('table').element.parentElement!;
    }

    // scrollTo comes from the setup.ts prototype mock, shared across tests:
    // spyOn returns that same mock, so its counters must be cleared per test.
    function spyScrollTo(el: HTMLElement) {
      const spy = vi.spyOn(el, 'scrollTo');
      spy.mockClear();
      return spy;
    }

    it('rechecks immediately on a replacement at origin, without scrolling', async () => {
      mountTable();
      await flushAll();
      const parentEl = scrollContainer();
      const scrollToSpy = spyScrollTo(parentEl);
      const observeBefore = observeCount;
      const unobserveBefore = unobserveCount;
      await wrapper.setProps({ content: content([rows[0]], true) });
      await flushAll();
      expect(unobserveCount).toBe(unobserveBefore + 1);
      expect(observeCount).toBe(observeBefore + 1);
      expect(scrollToSpy).not.toHaveBeenCalled();
      intersectCb!([{ isIntersecting: true }]);
      expect(wrapper.emitted('reachedEnd')).toHaveLength(1);
    });

    it('suppresses the clamp ghost during the return to origin, then rechecks on arrival', async () => {
      mountTable();
      await flushAll();
      const parentEl = scrollContainer();
      const scrollToSpy = spyScrollTo(parentEl);
      parentEl.scrollTop = 100;
      await wrapper.setProps({ content: content([rows[0]], true) });
      await flushAll();
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      // the clamp made the sentinel genuinely enter before the return moved anything
      intersectCb!([{ isIntersecting: true }]);
      expect(wrapper.emitted('reachedEnd')).toBeUndefined();
      const observeBefore = observeCount;
      parentEl.scrollTop = 0;
      parentEl.dispatchEvent(new Event('scroll'));
      expect(observeCount).toBe(observeBefore + 1);
      intersectCb!([{ isIntersecting: true }]);
      expect(wrapper.emitted('reachedEnd')).toHaveLength(1);
    });

    it('stays armed while the return has not reached the origin', async () => {
      mountTable();
      await flushAll();
      const parentEl = scrollContainer();
      parentEl.scrollTop = 100;
      await wrapper.setProps({ content: content([rows[0]], true) });
      await flushAll();
      parentEl.scrollTop = 40;
      parentEl.dispatchEvent(new Event('scroll'));
      intersectCb!([{ isIntersecting: true }]);
      expect(wrapper.emitted('reachedEnd')).toBeUndefined();
    });

    it('disarms via the safety expiration when the return never reaches the origin', async () => {
      vi.useFakeTimers();
      mountTable();
      await flushAll();
      const parentEl = scrollContainer();
      parentEl.scrollTop = 100;
      await wrapper.setProps({ content: content([rows[0]], true) });
      await flushAll();
      intersectCb!([{ isIntersecting: true }]);
      expect(wrapper.emitted('reachedEnd')).toBeUndefined();
      const observeBefore = observeCount;
      parentEl.scrollTop = 40; // the user grabbed the scroll mid-return
      vi.advanceTimersByTime(1500);
      expect(observeCount).toBe(observeBefore + 1);
      intersectCb!([{ isIntersecting: true }]);
      expect(wrapper.emitted('reachedEnd')).toHaveLength(1);
      vi.useRealTimers();
    });

    it('disarms when a replacement arrives at origin mid-return (no permanent mute)', async () => {
      mountTable();
      await flushAll();
      const parentEl = scrollContainer();
      parentEl.scrollTop = 100;
      await wrapper.setProps({ content: content([rows[0]], true) });
      await flushAll();
      // the return reached the origin, but its scroll event was not processed yet
      parentEl.scrollTop = 0;
      await wrapper.setProps({ content: content([rows[1]], true) });
      await flushAll();
      intersectCb!([{ isIntersecting: true }]);
      expect(wrapper.emitted('reachedEnd')).toHaveLength(1);
    });

    it('re-arms on a superseding replacement mid-return and settles once at origin', async () => {
      mountTable();
      await flushAll();
      const parentEl = scrollContainer();
      const scrollToSpy = spyScrollTo(parentEl);
      parentEl.scrollTop = 100;
      await wrapper.setProps({ content: content([rows[0]], true) });
      await flushAll();
      parentEl.scrollTop = 60; // still returning
      await wrapper.setProps({ content: content([rows[1]], true) });
      await flushAll();
      expect(scrollToSpy).toHaveBeenCalledTimes(2);
      intersectCb!([{ isIntersecting: true }]);
      expect(wrapper.emitted('reachedEnd')).toBeUndefined();
      parentEl.scrollTop = 0;
      parentEl.dispatchEvent(new Event('scroll'));
      intersectCb!([{ isIntersecting: true }]);
      expect(wrapper.emitted('reachedEnd')).toHaveLength(1);
    });

    it('does not recheck on an appended update while returning', async () => {
      mountTable();
      await flushAll();
      const parentEl = scrollContainer();
      parentEl.scrollTop = 100;
      await wrapper.setProps({ content: content([rows[0]], true) });
      await flushAll();
      // already clamped back to the origin, but the return has not settled yet
      parentEl.scrollTop = 0;
      const observeBefore = observeCount;
      await wrapper.setProps({ content: content([rows[0], { id: 3, first_name: 'Bob', last_name: 'Lee' }]) });
      await flushAll();
      expect(observeCount).toBe(observeBefore);
    });

    it('cleans up the return listener and safety timer on unmount', async () => {
      vi.useFakeTimers();
      mountTable();
      await flushAll();
      const parentEl = scrollContainer();
      const removeSpy = vi.spyOn(parentEl, 'removeEventListener');
      parentEl.scrollTop = 100;
      await wrapper.setProps({ content: content([rows[0]], true) });
      await flushAll();
      expect(vi.getTimerCount()).toBe(1); // the armed safety timer
      wrapper.unmount();
      expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      expect(vi.getTimerCount()).toBe(0); // cleared on dispose, not left to fire
      mountTable(); // afterEach unmounts this fresh instance instead of double-unmounting
      vi.useRealTimers();
    });
  });
});
