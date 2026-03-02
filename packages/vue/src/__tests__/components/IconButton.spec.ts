import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import IconButton from '@components/Common/IconButton.vue';
import { locale, loadedTranslations } from '@i18n/i18n';
import { registerIcons } from '@core/IconManager';

describe('IconButton', () => {
  it('renders a button with default type and class', () => {
    const wrapper = mount(IconButton, { props: { icon: 'add' } });
    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.attributes('type')).toBe('button');
    expect(button.classes()).toContain('qkit-btn-primary');
  });

  it('emits click on click', async () => {
    const wrapper = mount(IconButton, { props: { icon: 'add' } });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('respects disabled prop', () => {
    const wrapper = mount(IconButton, { props: { icon: 'add', disabled: true } });
    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });

  it('uses custom btnClass', () => {
    const wrapper = mount(IconButton, { props: { icon: 'add', btnClass: 'btn_danger' } });
    expect(wrapper.find('button').classes()).toContain('qkit-btn-danger');
  });

  it('uses custom button type', () => {
    const wrapper = mount(IconButton, { props: { icon: 'add', type: 'submit' } });
    expect(wrapper.find('button').attributes('type')).toBe('submit');
  });

  it('computes aria-label from icon name', () => {
    const wrapper = mount(IconButton, { props: { icon: 'add' } });
    expect(wrapper.find('button').attributes('aria-label')).toBe('add');
  });

  it('appends ariaLabel to translated label', () => {
    const wrapper = mount(IconButton, { props: { icon: 'add', ariaLabel: 'filters' } });
    expect(wrapper.find('button').attributes('aria-label')).toBe('add filters');
  });

  it('uses label prop for translation if provided', () => {
    const wrapper = mount(IconButton, { props: { icon: 'add', label: 'delete' } });
    expect(wrapper.find('button').attributes('aria-label')).toBe('delete');
  });

  it('does not set title when icon is not registered', () => {
    const wrapper = mount(IconButton, { props: { icon: 'add' } });
    expect(wrapper.find('button').attributes('title')).toBeUndefined();
  });

  it('sets title when icon is registered', () => {
    registerIcons({ add: { class: 'fa-plus' } });
    const wrapper = mount(IconButton, { props: { icon: 'add' } });
    expect(wrapper.find('button').attributes('title')).toBe('add');
  });

  it('updates aria-label when locale changes', async () => {
    const wrapper = mount(IconButton, { props: { icon: 'add' } });
    expect(wrapper.find('button').attributes('aria-label')).toBe('add');

    loadedTranslations['fr'] = { add: 'ajouter' };
    locale.value = 'fr';
    await nextTick();

    expect(wrapper.find('button').attributes('aria-label')).toBe('ajouter');
  });
});
