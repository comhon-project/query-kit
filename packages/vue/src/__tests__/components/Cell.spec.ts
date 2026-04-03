import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import Cell from '@components/Collection/Cell.vue';
import { resolve, registerLoader, registerTranslationsLoader, loadRawTranslations } from '@core/EntitySchema';
import { registerLoader as registerEnumLoader, registerTranslationsLoader as registerEnumTranslationsLoader } from '@core/EnumSchema';
import { registerTypeRenderers, registerPropertyRenderers } from '@core/CellRendererManager';
import { registerClasses } from '@core/ClassManager';
import { locale } from '@i18n/i18n';
import { entitySchemaLoader, entityTranslationsLoader, enumSchemaLoader, enumTranslationsLoader } from '@tests/assets/SchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { flushAll } from '@tests/helpers/flushAsync';
import type { EntitySchema } from '@core/EntitySchema';
import type { VueWrapper } from '@vue/test-utils';

let userSchema: EntitySchema;
let wrapper: VueWrapper;

const baseProps = {
  columnId: 'first_name',
  rowValue: { first_name: 'John', last_name: 'Doe', age: 30 },
  requestTimezone: 'UTC',
  userTimezone: 'UTC',
};

beforeEach(async () => {
  registerLoader(entitySchemaLoader);
  registerTranslationsLoader(entityTranslationsLoader);
  registerEnumLoader(enumSchemaLoader);
  registerEnumTranslationsLoader(enumTranslationsLoader);
  userSchema = await resolve('user');
});

afterEach(() => {
  wrapper?.unmount();
});

describe('Cell', () => {
  it('renders a text value via getNestedValue', () => {
    const property = userSchema.getProperty('first_name');
    wrapper = mountWithPlugin(Cell, {
      props: { ...baseProps, property },
    });
    expect(wrapper.find('td').text()).toBe('John');
  });

  it('renders a nested value via getNestedValue', () => {
    const property = userSchema.getProperty('first_name');
    wrapper = mountWithPlugin(Cell, {
      props: {
        ...baseProps,
        columnId: 'company.brand_name',
        rowValue: { company: { brand_name: 'Acme' } },
        property,
      },
    });
    expect(wrapper.find('td').text()).toBe('Acme');
  });

  it('renders with a custom renderer component', () => {
    const CustomRenderer = defineComponent({
      props: ['value'],
      render() {
        return h('strong', this.value);
      },
    });
    const property = userSchema.getProperty('first_name');
    wrapper = mountWithPlugin(Cell, {
      props: { ...baseProps, property, renderer: CustomRenderer },
    });
    expect(wrapper.find('strong').text()).toBe('John');
  });

  it('renders with a RenderFunction', () => {
    const renderFn = (value: unknown) => `[${value}]`;
    const property = userSchema.getProperty('first_name');
    wrapper = mountWithPlugin(Cell, {
      props: { ...baseProps, property, renderer: renderFn },
    });
    expect(wrapper.find('td').text()).toBe('[John]');
  });

  it('passes locale to RenderFunction and re-calls on locale change', async () => {
    const renderFn = (_value: unknown, _row: unknown, _col: string, loc: string) => `locale:${loc}`;
    const property = userSchema.getProperty('first_name');
    wrapper = mountWithPlugin(Cell, {
      props: { ...baseProps, property, renderer: renderFn },
    });
    expect(wrapper.find('td').text()).toBe('locale:en');

    locale.value = 'fr';
    await flushAll();
    expect(wrapper.find('td').text()).toBe('locale:fr');
  });

  it('renders undefined when no property and no renderer', () => {
    wrapper = mountWithPlugin(Cell, {
      props: { ...baseProps },
    });
    expect(wrapper.find('td').text()).toBe('');
  });

  it('adds role="button" and tabindex when onClick is set', () => {
    const property = userSchema.getProperty('first_name');
    wrapper = mountWithPlugin(Cell, {
      props: { ...baseProps, property, onClick: () => null },
    });
    const td = wrapper.find('td');
    expect(td.attributes('role')).toBe('button');
    expect(td.attributes('tabindex')).toBe('0');
  });

  it('triggers onClick on click and keyboard events', async () => {
    const onClick = vi.fn();
    const property = userSchema.getProperty('first_name');
    wrapper = mountWithPlugin(Cell, {
      props: { ...baseProps, property, onClick },
    });
    const td = wrapper.find('td');

    await td.trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith('John', baseProps.rowValue, 'first_name', expect.any(Event));

    await td.trigger('keydown', { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(2);

    await td.trigger('keydown', { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('does not add role or tabindex without onClick', () => {
    const property = userSchema.getProperty('first_name');
    wrapper = mountWithPlugin(Cell, {
      props: { ...baseProps, property },
    });
    const td = wrapper.find('td');
    expect(td.attributes('role')).toBeUndefined();
    expect(td.attributes('tabindex')).toBeUndefined();
  });

  it('renders enum property with translated value', async () => {
    const property = userSchema.getProperty('gender');
    wrapper = mountWithPlugin(Cell, {
      props: {
        ...baseProps,
        columnId: 'gender',
        rowValue: { gender: 'male' },
        property,
      },
    });
    await flushAll();
    expect(wrapper.find('td').text()).toBe('Mr.');
  });

  it('updates enum translation when locale changes', async () => {
    await loadRawTranslations('user', 'fr');
    const property = userSchema.getProperty('gender');
    wrapper = mountWithPlugin(Cell, {
      props: {
        ...baseProps,
        columnId: 'gender',
        rowValue: { gender: 'male' },
        property,
      },
    });
    await flushAll();
    expect(wrapper.find('td').text()).toBe('Mr.');

    locale.value = 'fr';
    await flushAll();
    expect(wrapper.find('td').text()).toBe('M.');
  });

  describe('plugin integration', () => {
    it('uses a custom type renderer component registered via registerTypeRenderers', () => {
      const CustomStringRenderer = defineComponent({
        props: ['value'],
        render() {
          return h('em', `custom:${this.value}`);
        },
      });
      registerTypeRenderers({ string: CustomStringRenderer });

      const property = userSchema.getProperty('first_name');
      wrapper = mountWithPlugin(Cell, {
        props: { ...baseProps, property },
      });
      expect(wrapper.find('em').text()).toBe('custom:John');
    });

    it('uses a custom type renderer RenderFunction registered via registerTypeRenderers', () => {
      registerTypeRenderers({ string: (value: unknown) => `rendered:${value}` });

      const property = userSchema.getProperty('first_name');
      wrapper = mountWithPlugin(Cell, {
        props: { ...baseProps, property },
      });
      expect(wrapper.find('td').text()).toBe('rendered:John');
    });

    it('uses a custom property renderer registered via registerPropertyRenderers', () => {
      const CustomPropRenderer = defineComponent({
        props: ['value'],
        render() {
          return h('mark', String(this.value));
        },
      });
      registerPropertyRenderers({ user: { first_name: CustomPropRenderer } });

      const property = userSchema.getProperty('first_name');
      wrapper = mountWithPlugin(Cell, {
        props: { ...baseProps, property },
      });
      expect(wrapper.find('mark').text()).toBe('John');
    });

    it('property renderer takes priority over type renderer', () => {
      const TypeRenderer = defineComponent({
        props: ['value'],
        render() {
          return h('em', 'type');
        },
      });
      const PropRenderer = defineComponent({
        props: ['value'],
        render() {
          return h('strong', 'property');
        },
      });
      registerTypeRenderers({ string: TypeRenderer });
      registerPropertyRenderers({ user: { first_name: PropRenderer } });

      const property = userSchema.getProperty('first_name');
      wrapper = mountWithPlugin(Cell, {
        props: { ...baseProps, property },
      });
      expect(wrapper.find('strong').text()).toBe('property');
      expect(wrapper.find('em').exists()).toBe(false);
    });

    it('uses custom CSS class registered via registerClasses', () => {
      registerClasses({ collection_cell: 'my-custom-cell' });

      const property = userSchema.getProperty('first_name');
      wrapper = mountWithPlugin(Cell, {
        props: { ...baseProps, property },
      });
      expect(wrapper.find('td').classes()).toContain('my-custom-cell');
    });
  });
});
