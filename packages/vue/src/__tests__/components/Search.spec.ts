import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Search from '@components/Search.vue';
import Builder from '@components/Filter/Builder.vue';
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

async function mountSearch(props: Record<string, unknown> = {}) {
  wrapper = mountWithPlugin(Search, {
    props: {
      entity: 'user',
      limit: 10,
      columns: ['first_name', 'last_name'],
      'onUpdate:columns': (v: unknown) => wrapper.setProps({ columns: v }),
      'onUpdate:filter': (v: unknown) => wrapper.setProps({ filter: v }),
      'onUpdate:orderBy': (v: unknown) => wrapper.setProps({ orderBy: v }),
      'onUpdate:page': (v: unknown) => wrapper.setProps({ page: v }),
      ...props,
    },
  });
  await flushAll();
}

async function mountSearchAndTriggerComputed(props: Record<string, unknown> = {}) {
  await mountSearch(props);
  // Advance timers to trigger Builder's debounced computed emit
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

    it('renders Builder component', async () => {
      await mountSearch();
      expect(wrapper.findComponent(Builder).exists()).toBe(true);
    });

    it('does NOT render Collection before Builder emits computed filter', async () => {
      await mountSearch();
      // Before timers advance, Builder has not emitted computed yet
      expect(wrapper.findComponent(Collection).exists()).toBe(false);
    });

    it('renders Collection after Builder emits computed filter', async () => {
      const { requester } = createMockRequester();
      await mountSearchAndTriggerComputed({ requester });
      expect(wrapper.findComponent(Collection).exists()).toBe(true);
    });
  });

  // ==================== Prop forwarding ====================
  describe('prop forwarding', () => {
    it('forwards props to Builder', async () => {
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
      const builder = wrapper.findComponent(Builder);
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
      const onRowClick = vi.fn();
      const onExport = vi.fn();
      const postRequest = vi.fn();
      const { requester } = createMockRequester();
      await mountSearchAndTriggerComputed({
        customColumns: { full_name: { label: 'Full Name' } },
        directQuery: true,
        quickSort: true,
        displayCount: true,
        editColumns: true,
        allowedCollectionTypes: ['pagination'],
        userTimezone: 'Europe/Paris',
        requestTimezone: 'America/New_York',
        onRowClick,
        onExport,
        postRequest,
        requester,
      });
      const collection = wrapper.findComponent(Collection);
      expect(collection.props('entity')).toBe('user');
      expect(collection.props('limit')).toBe(10);
      expect(collection.props('customColumns')).toEqual({ full_name: { label: 'Full Name' } });
      expect(collection.props('directQuery')).toBe(true);
      expect(collection.props('quickSort')).toBe(true);
      expect(collection.props('displayCount')).toBe(true);
      expect(collection.props('editColumns')).toBe(true);
      expect(collection.props('allowedCollectionTypes')).toEqual(['pagination']);
      expect(collection.props('userTimezone')).toBe('Europe/Paris');
      expect(collection.props('requestTimezone')).toBe('America/New_York');
      expect(collection.props('onRowClick')).toBe(onRowClick);
      expect(collection.props('onExport')).toBe(onExport);
      expect(collection.props('postRequest')).toBe(postRequest);
      expect(collection.props('requester')).toStrictEqual(requester);
    });
  });

  describe('v-model forwarding', () => {
    it('propagates columns update from Collection', async () => {
      const { requester } = createMockRequester();
      await mountSearchAndTriggerComputed({ requester });

      const collection = wrapper.findComponent(Collection);
      collection.vm.$emit('update:columns', ['age']);
      await flushAll();

      expect(wrapper.emitted('update:columns')?.pop()?.[0]).toEqual(['age']);
    });

    it('propagates orderBy update from Collection', async () => {
      const { requester } = createMockRequester();
      await mountSearchAndTriggerComputed({ requester });

      const collection = wrapper.findComponent(Collection);
      collection.vm.$emit('update:orderBy', [{ column: 'age', direction: 'desc' }]);
      await flushAll();

      expect(wrapper.emitted('update:orderBy')?.pop()?.[0]).toEqual([{ column: 'age', direction: 'desc' }]);
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
    it('sets location.hash when validate is triggered', async () => {
      const { requester } = createMockRequester();
      await mountSearchAndTriggerComputed({ requester, manual: true });

      const collection = wrapper.findComponent(Collection);
      const collectionId = collection.attributes('id');

      // Click the search/validate button in Builder (manual must be explicitly true)
      const builder = wrapper.findComponent(Builder);
      const searchBtn = builder.findAll('button').find((b) => b.attributes('aria-label')?.includes('search'));
      expect(searchBtn).toBeDefined();
      await searchBtn!.trigger('click');
      await flushAll();

      expect(location.hash).toBe('#' + collectionId);
    });
  });
});
