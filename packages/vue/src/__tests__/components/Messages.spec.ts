import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import InvalidData from '@components/Messages/InvalidData.vue';
import InvalidColumn from '@components/Messages/InvalidColumn.vue';
import InvalidEntity from '@components/Messages/InvalidEntity.vue';
import InvalidProperty from '@components/Messages/InvalidProperty.vue';
import InvalidScope from '@components/Messages/InvalidScope.vue';
import InvalidOperator from '@components/Messages/InvalidOperator.vue';
import InvalidType from '@components/Messages/InvalidType.vue';
import { locale, loadedTranslations } from '@i18n/i18n';

describe('Messages', () => {
  describe('InvalidData', () => {
    it('renders translated message key and value', () => {
      const wrapper = mount(InvalidData, {
        props: { messageKey: 'invalid_column', value: 'foo' },
      });
      expect(wrapper.text()).toContain('invalid column:');
      expect(wrapper.text()).toContain('foo');
    });

    it('has role="alert"', () => {
      const wrapper = mount(InvalidData, {
        props: { messageKey: 'invalid_property', value: 'bar' },
      });
      expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    });

    it('applies error_message class', () => {
      const wrapper = mount(InvalidData, {
        props: { messageKey: 'invalid_entity', value: 'baz' },
      });
      expect(wrapper.find('.qkit-error-message').exists()).toBe(true);
    });
  });

  describe('InvalidColumn', () => {
    it('passes column to InvalidData with invalid_column key', () => {
      const wrapper = mount(InvalidColumn, { props: { column: 'my_col' } });
      expect(wrapper.text()).toContain('invalid column:');
      expect(wrapper.text()).toContain('my_col');
    });
  });

  describe('InvalidEntity', () => {
    it('passes entity to InvalidData with invalid_entity key', () => {
      const wrapper = mount(InvalidEntity, { props: { entity: 'user' } });
      expect(wrapper.text()).toContain('invalid entity:');
      expect(wrapper.text()).toContain('user');
    });
  });

  describe('InvalidProperty', () => {
    it('passes property to InvalidData with invalid_property key', () => {
      const wrapper = mount(InvalidProperty, { props: { property: 'first_name' } });
      expect(wrapper.text()).toContain('invalid property:');
      expect(wrapper.text()).toContain('first_name');
    });
  });

  describe('InvalidScope', () => {
    it('passes id to InvalidData with invalid_scope key', () => {
      const wrapper = mount(InvalidScope, { props: { id: 'scope_1' } });
      expect(wrapper.text()).toContain('invalid scope:');
      expect(wrapper.text()).toContain('scope_1');
    });
  });

  describe('InvalidOperator', () => {
    it('passes operator to InvalidData with invalid_operator key', () => {
      const wrapper = mount(InvalidOperator, { props: { operator: 'like' } });
      expect(wrapper.text()).toContain('invalid operator:');
      expect(wrapper.text()).toContain('like');
    });
  });

  describe('InvalidType', () => {
    it('extracts leaf type and passes to InvalidData', () => {
      const wrapper = mount(InvalidType, {
        props: { typeContainer: { type: 'custom_type' } },
      });
      expect(wrapper.text()).toContain('invalid type:');
      expect(wrapper.text()).toContain('custom_type');
    });

    it('extracts nested array leaf type', () => {
      const wrapper = mount(InvalidType, {
        props: {
          typeContainer: { type: 'array', children: { type: 'nested_type' } },
        },
      });
      expect(wrapper.text()).toContain('nested_type');
    });
  });

  describe('locale reactivity', () => {
    it('updates InvalidData translation when locale changes', async () => {
      const wrapper = mount(InvalidData, {
        props: { messageKey: 'invalid_column', value: 'foo' },
      });
      expect(wrapper.text()).toContain('invalid column:');

      loadedTranslations['fr'] = { invalid_column: 'colonne invalide :' };
      locale.value = 'fr';
      await nextTick();

      expect(wrapper.text()).toContain('colonne invalide :');
      expect(wrapper.text()).toContain('foo');
    });
  });
});
