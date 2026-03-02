import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import CollapseButton from '@components/Common/CollapseButton.vue';
import { locale, loadedTranslations } from '@i18n/i18n';

describe('CollapseButton', () => {
  it('renders with aria-expanded=true when not collapsed', () => {
    const wrapper = mount(CollapseButton, { props: { collapsed: false, 'onUpdate:collapsed': () => {} } });
    expect(wrapper.find('button').attributes('aria-expanded')).toBe('true');
  });

  it('renders with aria-expanded=false when collapsed', () => {
    const wrapper = mount(CollapseButton, { props: { collapsed: true, 'onUpdate:collapsed': () => {} } });
    expect(wrapper.find('button').attributes('aria-expanded')).toBe('false');
  });

  it('toggles collapsed on click', async () => {
    const wrapper = mount(CollapseButton, { props: { collapsed: false, 'onUpdate:collapsed': () => {} } });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('update:collapsed')![0]).toEqual([true]);
  });

  it('shows expand text when collapsed (no icon)', () => {
    const wrapper = mount(CollapseButton, { props: { collapsed: true, 'onUpdate:collapsed': () => {} } });
    expect(wrapper.text()).toBe('expand');
  });

  it('shows collapse text when expanded (no icon)', () => {
    const wrapper = mount(CollapseButton, { props: { collapsed: false, 'onUpdate:collapsed': () => {} } });
    expect(wrapper.text()).toBe('collapse');
  });

  it('includes ariaLabel in computed label', () => {
    const wrapper = mount(CollapseButton, {
      props: { collapsed: false, ariaLabel: 'filters', 'onUpdate:collapsed': () => {} },
    });
    expect(wrapper.find('button').attributes('aria-label')).toBe('collapse filters');
  });

  it('updates translations when locale changes', async () => {
    const wrapper = mount(CollapseButton, { props: { collapsed: true, 'onUpdate:collapsed': () => {} } });
    expect(wrapper.text()).toBe('expand');

    loadedTranslations['fr'] = { expand: 'déplier', collapse: 'replier' };
    locale.value = 'fr';
    await nextTick();

    expect(wrapper.text()).toBe('déplier');
  });
});
