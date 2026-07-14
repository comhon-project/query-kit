import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Search from '@components/Search.vue';
import QueryBuilder from '@components/QueryBuilder.vue';
import Collection from '@components/Collection/Collection.vue';
import FieldsBuilder from '@components/Collection/FieldsBuilder.vue';
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
        editFields: 'query-builder',
        customFields: { full_name: { label: 'Full Name' } },
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
      expect(builder.props('manual')).toBe(false);
      expect(builder.props('editFields')).toBe(true);
      expect(builder.props('customFields')).toEqual({ full_name: { label: 'Full Name' } });
      expect(builder.props('fields')).toEqual(['first_name', 'last_name']);
    });

    it('propagates fields update from QueryBuilder', async () => {
      const { requester } = createMockRequester();
      await mountSearchAndTriggerComputed({ requester });

      wrapper.findComponent(QueryBuilder).vm.$emit('update:fields', ['age']);
      await flushAll();

      expect(wrapper.emitted('update:fields')?.pop()?.[0]).toEqual(['age']);
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
        editFields: 'collection',
        allowedCollectionTypes: ['pagination'],
        userTimezone: 'Europe/Paris',
        requestTimezone: 'America/New_York',
        reflow: true,
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
      expect(collection.props('reflow')).toBe(true);
      expect(collection.props('userTimezone')).toBe('Europe/Paris');
      expect(collection.props('requestTimezone')).toBe('America/New_York');
      expect(collection.props('onItemClick')).toBe(onItemClick);
      expect(collection.props('onExport')).toBe(onExport);
      expect(collection.props('postRequest')).toBe(postRequest);
      expect(collection.props('requester')).toStrictEqual(requester);
    });
  });

  describe('editFields location', () => {
    it('routes field editing to the query builder only', async () => {
      await mountSearch({ editFields: 'query-builder' });
      expect(wrapper.findComponent(QueryBuilder).props('editFields')).toBe(true);
      expect(wrapper.findComponent(Collection).props('editFields')).toBe(false);
    });

    it('routes field editing to the collection only', async () => {
      await mountSearch({ editFields: 'collection' });
      expect(wrapper.findComponent(QueryBuilder).props('editFields')).toBe(false);
      expect(wrapper.findComponent(Collection).props('editFields')).toBe(true);
    });

    it('disables field editing in both when set to none', async () => {
      await mountSearch({ editFields: 'none' });
      expect(wrapper.findComponent(QueryBuilder).props('editFields')).toBe(false);
      expect(wrapper.findComponent(Collection).props('editFields')).toBe(false);
    });

    it('disables field editing in both when omitted', async () => {
      await mountSearch();
      expect(wrapper.findComponent(QueryBuilder).props('editFields')).toBe(false);
      expect(wrapper.findComponent(Collection).props('editFields')).toBe(false);
    });
  });

  describe('fields editing', () => {
    it('debounces the request when fields are edited via the query builder', async () => {
      const { requester, calls } = createMockRequester();
      await mountSearchAndTriggerComputed({ requester, editFields: 'query-builder', debounce: 1000 });
      const before = calls.length;

      // Emit from the FieldsBuilder actually rendered inside the QueryBuilder.
      const fieldsBuilder = wrapper.findComponent(QueryBuilder).findComponent(FieldsBuilder);
      expect(fieldsBuilder.exists()).toBe(true);
      fieldsBuilder.vm.$emit('update:modelValue', ['first_name']);
      await flushAll();
      expect(calls.length).toBe(before);

      vi.advanceTimersByTime(1000);
      await flushAll();
      expect(calls.length).toBe(before + 1);
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

  describe('validate', () => {
    it('triggers a collection request when QueryBuilder emits validate (manual mode)', async () => {
      const { requester, calls } = createMockRequester();
      await mountSearchAndTriggerComputed({ requester, manual: true });
      const before = calls.length;
      wrapper.findComponent(QueryBuilder).vm.$emit('validate');
      await flushAll();
      expect(calls.length).toBe(before + 1);
    });

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
