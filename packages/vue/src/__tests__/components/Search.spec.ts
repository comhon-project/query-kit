import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Search from '@components/Search.vue';
import QueryBuilder from '@components/QueryBuilder.vue';
import Collection from '@components/Collection/Collection.vue';
import { registerLoader, registerTranslationsLoader } from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { flushAll } from '@tests/helpers/flushAsync';
import { createMockRequester } from '@tests/helpers/createMockRequester';
import type { VueWrapper } from '@vue/test-utils';

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

async function mountSearch(props: Record<string, unknown> = {}, mountOptions: Record<string, unknown> = {}) {
  // computed fires immediately on mount in the new architecture, so Collection
  // renders synchronously and would throw without a requester.
  const defaultRequester = createMockRequester().requester;
  wrapper = mountWithPlugin(Search, {
    ...mountOptions,
    props: {
      entity: 'user',
      limit: 10,
      fields: ['first_name', 'last_name'],
      requester: defaultRequester,
      'onUpdate:fields': (v: unknown) => wrapper.setProps({ fields: v }),
      'onUpdate:filter': (v: unknown) => wrapper.setProps({ filter: v }),
      'onUpdate:sort': (v: unknown) => wrapper.setProps({ sort: v }),
      'onUpdate:page': (v: unknown) => wrapper.setProps({ page: v }),
      ...props,
    },
  });
  await flushAll();
}

async function mountSearchAndTriggerComputed(props: Record<string, unknown> = {}, mountOptions: Record<string, unknown> = {}) {
  await mountSearch(props, mountOptions);
  // Advance timers to trigger QueryBuilder's debounced computed emit
  vi.advanceTimersByTime(1000);
  await flushAll();
}

describe('Search', () => {
  // ==================== Rendering ====================
  describe('rendering', () => {
    it('renders div wrapper with qkit-search class', async () => {
      await mountSearch();
      const div = wrapper.find('div.qkit-search');
      expect(div.exists()).toBe(true);
    });

    it('renders QueryBuilder component', async () => {
      await mountSearch();
      expect(wrapper.findComponent(QueryBuilder).exists()).toBe(true);
    });

    it('renders Collection after QueryBuilder emits computed filter', async () => {
      const { requester } = createMockRequester();
      await mountSearchAndTriggerComputed({ requester });
      expect(wrapper.findComponent(Collection).exists()).toBe(true);
    });
  });

  // ==================== Prop forwarding ====================
  describe('prop forwarding', () => {
    it('forwards props to QueryBuilder', async () => {
      await mountSearch({
        allowReset: false,
        allowUndo: false,
        allowRedo: false,
        allowedScopes: ['active'],
        allowedProperties: ['first_name'],
        displayOperator: false,
        userTimezone: 'Europe/Paris',
        requestTimezone: 'America/New_York',
        debounce: 2000,
        manual: false,
      });
      const builder = wrapper.findComponent(QueryBuilder);
      expect(builder.props('entity')).toBe('user');
      expect(builder.props('allowReset')).toBe(false);
      expect(builder.props('allowUndo')).toBe(false);
      expect(builder.props('allowRedo')).toBe(false);
      expect(builder.props('allowedScopes')).toEqual(['active']);
      expect(builder.props('allowedProperties')).toEqual(['first_name']);
      expect(builder.props('displayOperator')).toBe(false);
      expect(builder.props('userTimezone')).toBe('Europe/Paris');
      expect(builder.props('requestTimezone')).toBe('America/New_York');
      expect(builder.props('debounce')).toBe(2000);
      expect(builder.props('manual')).toBe(false);
    });

    it('forwards props to Collection', async () => {
      const onItemClick = vi.fn();
      const onExport = vi.fn();
      const postRequest = vi.fn();
      const { requester } = createMockRequester();
      await mountSearchAndTriggerComputed({
        customFields: { full_name: { label: 'Full Name' } },
        directQuery: true,
        quickSort: true,
        displayCount: true,
        editFields: true,
        allowedCollectionTypes: ['pagination'],
        userTimezone: 'Europe/Paris',
        requestTimezone: 'America/New_York',
        onItemClick,
        onExport,
        postRequest,
        requester,
      });
      const collection = wrapper.findComponent(Collection);
      expect(collection.props('entity')).toBe('user');
      expect(collection.props('limit')).toBe(10);
      expect(collection.props('customFields')).toEqual({ full_name: { label: 'Full Name' } });
      expect(collection.props('directQuery')).toBe(true);
      expect(collection.props('quickSort')).toBe(true);
      expect(collection.props('displayCount')).toBe(true);
      expect(collection.props('editFields')).toBe(true);
      expect(collection.props('allowedCollectionTypes')).toEqual(['pagination']);
      expect(collection.props('userTimezone')).toBe('Europe/Paris');
      expect(collection.props('requestTimezone')).toBe('America/New_York');
      expect(collection.props('onItemClick')).toBe(onItemClick);
      expect(collection.props('onExport')).toBe(onExport);
      expect(collection.props('postRequest')).toBe(postRequest);
      expect(collection.props('requester')).toStrictEqual(requester);
    });
  });

  describe('v-model forwarding', () => {
    it('propagates fields update from Collection', async () => {
      const { requester } = createMockRequester();
      await mountSearchAndTriggerComputed({ requester });

      const collection = wrapper.findComponent(Collection);
      collection.vm.$emit('update:fields', ['age']);
      await flushAll();

      expect(wrapper.emitted('update:fields')?.pop()?.[0]).toEqual(['age']);
    });

    it('propagates sort update from Collection', async () => {
      const { requester } = createMockRequester();
      await mountSearchAndTriggerComputed({ requester });

      const collection = wrapper.findComponent(Collection);
      collection.vm.$emit('update:sort', [{ field: 'age', direction: 'desc' }]);
      await flushAll();

      expect(wrapper.emitted('update:sort')?.pop()?.[0]).toEqual([{ field: 'age', direction: 'desc' }]);
    });

    it('propagates page update from Collection', async () => {
      const { requester } = createMockRequester();
      await mountSearchAndTriggerComputed({ requester });

      const collection = wrapper.findComponent(Collection);
      collection.vm.$emit('update:page', 3);
      await flushAll();

      expect(wrapper.emitted('update:page')?.pop()?.[0]).toBe(3);
    });
  });

  describe('onComputed', () => {
    it('scrolls to the collection on every manual validate (not just the first)', async () => {
      const { requester } = createMockRequester();
      await mountSearchAndTriggerComputed({ requester, manual: true }, { attachTo: document.body });

      const collection = wrapper.findComponent(Collection);
      const scrollIntoView = vi.spyOn(collection.element, 'scrollIntoView');

      const builder = wrapper.findComponent(QueryBuilder);
      const searchBtn = builder.findAll('button').find((b) => b.attributes('aria-label')?.includes('search'));
      expect(searchBtn).toBeDefined();

      await searchBtn!.trigger('click');
      await flushAll();
      await searchBtn!.trigger('click');
      await flushAll();

      expect(scrollIntoView).toHaveBeenCalledTimes(2);
    });
  });
});
