import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import Icon from '@components/Common/Icon.vue';
import { locale, loadedTranslations } from '@i18n/i18n';
import { registerIcons } from '@core/IconManager';

describe('Icon', () => {
  it('renders text fallback when icon is not registered', () => {
    const wrapper = mount(Icon, { props: { icon: 'add' } });
    expect(wrapper.text()).toBe('add');
  });

  it('renders text fallback with custom label', () => {
    const wrapper = mount(Icon, { props: { icon: 'add', label: 'add_item' } });
    expect(wrapper.text()).toBe('add_item');
  });

  it('renders icon component when icon is a string value', () => {
    registerIcons({ add: { class: 'fa-plus' } });
    const wrapper = mount(Icon, { props: { icon: 'add' } });
    expect(wrapper.find('i').exists()).toBe(true);
    expect(wrapper.find('i').attributes('class')).toBe('fa-plus');
    expect(wrapper.find('i').attributes('aria-hidden')).toBe('true');
  });

  it('renders icon component when icon is an object', () => {
    registerIcons({ add: { class: 'fa fa-plus' } });
    const wrapper = mount(Icon, { props: { icon: 'add' } });
    expect(wrapper.find('i').exists()).toBe(true);
    expect(wrapper.find('i').attributes('class')).toBe('fa fa-plus');
  });

  it('updates text fallback when locale changes', async () => {
    const wrapper = mount(Icon, { props: { icon: 'add' } });
    expect(wrapper.text()).toBe('add');

    loadedTranslations['fr'] = { add: 'ajouter' };
    locale.value = 'fr';
    await nextTick();

    expect(wrapper.text()).toBe('ajouter');
  });
});
