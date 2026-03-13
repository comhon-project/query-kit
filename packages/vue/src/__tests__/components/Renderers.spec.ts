import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import type { CellRendererProps, RenderFunction } from '@core/types';
import * as RendererExports from '@components/Common/Renderers/index';

import BooleanRenderer from '@components/Common/Renderers/Boolean.vue';
import DateRenderer from '@components/Common/Renderers/Date.vue';
import DateTimeRenderer from '@components/Common/Renderers/DateTime.vue';
import TimeRenderer from '@components/Common/Renderers/Time.vue';
import EnumRenderer from '@components/Common/Renderers/Enum.vue';
import EntityRenderer from '@components/Common/Renderers/Entity.vue';
import HtmlRenderer from '@components/Common/Renderers/Html.vue';
import ArrayRenderer from '@components/Common/Renderers/Array.vue';
import { registerLoader as registerEnumLoader } from '@core/EnumSchema';
import { registerLoader as registerEntityLoader } from '@core/EntitySchema';
import { registerTypeRenderers } from '@core/CellRendererManager';
import { config } from '@config/config';
import { locale, loadedTranslations } from '@i18n/i18n';
import { entitySchemaLoader, enumSchemaLoader } from '@tests/assets/SchemaLoader';

function baseProps(overrides: Partial<CellRendererProps> = {}): CellRendererProps {
  return {
    columnId: 'col',
    property: { id: 'test', type: 'string', owner: 'user' },
    type: { type: 'string' },
    value: null,
    rowValue: {},
    requestTimezone: 'UTC',
    userTimezone: 'UTC',
    ...overrides,
  };
}

describe('Renderers', () => {
  beforeEach(() => {
    registerEnumLoader(enumSchemaLoader);
    registerEntityLoader(entitySchemaLoader);
  });

  // ──────────── Barrel Export ────────────
  describe('barrel export', () => {
    it('re-exports all renderer components', () => {
      expect(RendererExports.Array).toBeDefined();
      expect(RendererExports.Boolean).toBeDefined();
      expect(RendererExports.Date).toBeDefined();
      expect(RendererExports.DateTime).toBeDefined();
      expect(RendererExports.Enum).toBeDefined();
      expect(RendererExports.Entity).toBeDefined();
      expect(RendererExports.Html).toBeDefined();
      expect(RendererExports.Time).toBeDefined();
    });
  });

  // ──────────── Boolean ────────────
  describe('Boolean', () => {
    it('renders "yes" for true', () => {
      const wrapper = mount(BooleanRenderer, { props: baseProps({ value: true }) });
      expect(wrapper.text()).toBe('yes');
    });

    it('renders "no" for false', () => {
      const wrapper = mount(BooleanRenderer, { props: baseProps({ value: false }) });
      expect(wrapper.text()).toBe('no');
    });

    it('renders nothing for null', () => {
      const wrapper = mount(BooleanRenderer, { props: baseProps({ value: null }) });
      expect(wrapper.text()).toBe('');
    });

    it('renders nothing for undefined', () => {
      const wrapper = mount(BooleanRenderer, { props: baseProps({ value: undefined }) });
      expect(wrapper.text()).toBe('');
    });

    it('updates translation when locale changes', async () => {
      const wrapper = mount(BooleanRenderer, { props: baseProps({ value: true }) });
      expect(wrapper.text()).toBe('yes');

      loadedTranslations['fr'] = { yes: 'oui', no: 'non' };
      locale.value = 'fr';
      await nextTick();

      expect(wrapper.text()).toBe('oui');
    });
  });

  // ──────────── Date ────────────
  describe('Date', () => {
    it('formats a date string', () => {
      const wrapper = mount(DateRenderer, { props: baseProps({ value: '2024-06-15' }) });
      expect(wrapper.text()).not.toBe('');
      // Verify it's a formatted date (contains the year)
      expect(wrapper.text()).toContain('2024');
    });

    it('renders nothing for falsy value', () => {
      const wrapper = mount(DateRenderer, { props: baseProps({ value: null }) });
      expect(wrapper.text()).toBe('');
    });

    it('renders nothing for empty string', () => {
      const wrapper = mount(DateRenderer, { props: baseProps({ value: '' }) });
      expect(wrapper.text()).toBe('');
    });

    it('updates formatting when locale changes', async () => {
      const wrapper = mount(DateRenderer, { props: baseProps({ value: '2024-06-15' }) });
      const textEn = wrapper.text();

      locale.value = 'de';
      await nextTick();

      const textDe = wrapper.text();
      expect(textDe).toContain('2024');
      expect(textDe).not.toBe(textEn);
    });
  });

  // ──────────── DateTime ────────────
  describe('DateTime', () => {
    it('formats a datetime string in UTC', () => {
      const wrapper = mount(DateTimeRenderer, {
        props: baseProps({ value: '2024-06-15T14:30:00', requestTimezone: 'UTC', userTimezone: 'UTC' }),
      });
      expect(wrapper.text()).toContain('6/15/2024');
      expect(wrapper.text()).toMatch(/02:30/);
    });

    it('converts time from requestTimezone to userTimezone', () => {
      const wrapper = mount(DateTimeRenderer, {
        props: baseProps({
          value: '2024-06-15T23:00:00',
          requestTimezone: 'UTC',
          userTimezone: 'America/New_York',
        }),
      });
      // NYC is UTC-4 in June, so 23:00 UTC → 19:00 NYC
      expect(wrapper.text()).toMatch(/07:00/);
    });

    it('changes date when timezone conversion crosses midnight', () => {
      const wrapper = mount(DateTimeRenderer, {
        props: baseProps({
          value: '2024-06-16T02:00:00',
          requestTimezone: 'UTC',
          userTimezone: 'America/New_York',
        }),
      });
      // UTC June 16 02:00 → NYC June 15 22:00
      expect(wrapper.text()).toContain('6/15/2024');
      expect(wrapper.text()).toMatch(/10:00/);
    });

    it('renders nothing for falsy value', () => {
      const wrapper = mount(DateTimeRenderer, { props: baseProps({ value: null }) });
      expect(wrapper.text()).toBe('');
    });

    it('updates formatting when locale changes', async () => {
      const wrapper = mount(DateTimeRenderer, {
        props: baseProps({ value: '2024-06-15T14:30:00', requestTimezone: 'UTC', userTimezone: 'UTC' }),
      });
      // EN: month/day/year
      expect(wrapper.text()).toContain('6/15/2024');

      locale.value = 'fr';
      await nextTick();

      // FR: day/month/year, 24h format
      expect(wrapper.text()).toContain('15/06/2024');
      expect(wrapper.text()).toContain('14:30');
    });
  });

  // ──────────── Time ────────────
  describe('Time', () => {
    it('formats a time string', () => {
      const wrapper = mount(TimeRenderer, { props: baseProps({ value: '14:30:00' }) });
      expect(wrapper.text()).not.toBe('');
    });

    it('renders nothing for falsy value', () => {
      const wrapper = mount(TimeRenderer, { props: baseProps({ value: null }) });
      expect(wrapper.text()).toBe('');
    });
  });

  // ──────────── Enum ────────────
  describe('Enum', () => {
    it('renders enum case name', async () => {
      const wrapper = mount(EnumRenderer, {
        props: baseProps({ value: 'male', type: { type: 'string', enum: 'gender' } }),
      });

      await flushPromises();
      expect(wrapper.text()).toBe('Mr.');
    });

    it('renders nothing for unknown case', async () => {
      const wrapper = mount(EnumRenderer, {
        props: baseProps({ value: 'unknown', type: { type: 'string', enum: 'gender' } }),
      });

      await flushPromises();
      expect(wrapper.text()).toBe('');
    });
  });

  // ──────────── Entity ────────────
  describe('Entity', () => {
    it('renders primary identifiers joined with space', async () => {
      const wrapper = mount(EntityRenderer, {
        props: baseProps({
          value: { brand_name: 'Acme Corp', id: 1 },
          property: { id: 'company', type: 'relationship', owner: 'user', entity: 'organization' },
        }),
      });

      await flushPromises();
      expect(wrapper.text()).toBe('Acme Corp');
    });

    it('renders unique identifier when no primary_identifiers', async () => {
      registerEntityLoader({
        load: async () => ({ properties: [], unique_identifier: 'id' }),
      });

      const wrapper = mount(EntityRenderer, {
        props: baseProps({
          value: { id: 42, name: 'Acme' },
          property: { id: 'company', type: 'relationship', owner: 'user', entity: 'no_primary' },
        }),
      });

      await flushPromises();
      expect(wrapper.text()).toBe('42');
    });

    it('renders nothing until schema resolves', () => {
      registerEntityLoader({
        load: () => new Promise(() => {}),
      });

      const wrapper = mount(EntityRenderer, {
        props: baseProps({
          property: { id: 'company', type: 'relationship', owner: 'user', entity: 'pending' },
        }),
      });
      expect(wrapper.text()).toBe('');
    });

    it('uses dot notation from rowValue when value is null', async () => {
      const wrapper = mount(EntityRenderer, {
        props: baseProps({
          columnId: 'company',
          value: null,
          rowValue: { 'company.brand_name': 'Acme Corp', 'company.id': 1 },
          property: { id: 'company', type: 'relationship', owner: 'user', entity: 'organization' },
        }),
      });

      await flushPromises();
      expect(wrapper.text()).toBe('Acme Corp');
    });
  });

  // ──────────── Html ────────────
  describe('Html', () => {
    it('renders as plain text by default', () => {
      const wrapper = mount(HtmlRenderer, {
        props: baseProps({ value: '<b>bold</b>' }),
      });
      expect(wrapper.text()).toBe('<b>bold</b>');
      expect(wrapper.find('b').exists()).toBe(false);
    });

    it('renders as HTML when config.renderHtml is true', () => {
      config.renderHtml = true;
      const wrapper = mount(HtmlRenderer, {
        props: baseProps({ value: '<b>bold</b>' }),
      });
      expect(wrapper.find('b').exists()).toBe(true);
      expect(wrapper.find('b').text()).toBe('bold');
    });
  });

  // ──────────── Array ────────────
  describe('Array', () => {
    it('renders function-based renderer values comma-separated', () => {
      const renderFn: RenderFunction = vi.fn((value: unknown) => `[${value}]`);
      registerTypeRenderers({ string: renderFn });

      const wrapper = mount(ArrayRenderer, {
        props: baseProps({
          value: ['a', 'b', 'c'],
          type: { type: 'array', items: { type: 'string' } },
        }),
      });

      expect(wrapper.text()).toBe('[a], [b], [c]');
    });

    it('renders empty array as empty', () => {
      const wrapper = mount(ArrayRenderer, {
        props: baseProps({
          value: [],
          type: { type: 'array', items: { type: 'string' } },
        }),
      });

      expect(wrapper.text()).toBe('');
    });

    it('renders null value as empty', () => {
      const wrapper = mount(ArrayRenderer, {
        props: baseProps({
          value: null,
          type: { type: 'array', items: { type: 'string' } },
        }),
      });

      expect(wrapper.text()).toBe('');
    });
  });
});
