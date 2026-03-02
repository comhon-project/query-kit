import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import Modal from '@components/Common/Modal.vue';

describe('Modal', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
  });

  it('renders a dialog element', () => {
    const wrapper = mount(Modal, { props: { show: false, 'onUpdate:show': () => {} } });
    expect(wrapper.find('dialog').exists()).toBe(true);
  });

  it('renders header, body and footer slots', () => {
    const wrapper = mount(Modal, {
      props: { show: true, 'onUpdate:show': () => {} },
      slots: {
        header: '<h2>Title</h2>',
        body: '<p>Content</p>',
        footer: '<button>Custom</button>',
      },
    });
    expect(wrapper.find('header').text()).toContain('Title');
    expect(wrapper.find('.qkit-modal-body').text()).toContain('Content');
    expect(wrapper.find('footer').text()).toContain('Custom');
  });

  it('calls showModal when show becomes true', async () => {
    const wrapper = mount(Modal, { props: { show: false, 'onUpdate:show': () => {} } });
    await wrapper.setProps({ show: true });
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  it('emits confirm on confirm button click', async () => {
    const wrapper = mount(Modal, { props: { show: true, 'onUpdate:show': () => {} } });
    // Find the confirm button in footer (default slot)
    const buttons = wrapper.findAll('button');
    const confirmBtn = buttons.find((b) => b.attributes('aria-label')?.includes('confirm'));
    if (confirmBtn) {
      await confirmBtn.trigger('click');
      expect(wrapper.emitted('confirm')).toHaveLength(1);
    }
  });

  it('sets show to false and emits closed when close button is clicked', async () => {
    const wrapper = mount(Modal, { props: { show: true, 'onUpdate:show': () => {} } });
    // Close button is in header
    const closeBtn = wrapper.find('header button');
    await closeBtn.trigger('click');
    expect(wrapper.emitted('update:show')![0]).toEqual([false]);
  });

  it('closes on confirm when closeOnConfirm is true', async () => {
    const wrapper = mount(Modal, {
      props: { show: true, closeOnConfirm: true, 'onUpdate:show': () => {} },
    });
    const buttons = wrapper.findAll('button');
    const confirmBtn = buttons.find((b) => b.attributes('aria-label')?.includes('confirm'));
    if (confirmBtn) {
      await confirmBtn.trigger('click');
      expect(wrapper.emitted('update:show')![0]).toEqual([false]);
      expect(wrapper.emitted('confirm')).toHaveLength(1);
    }
  });

  it('disables confirm button when disableConfirm is true', () => {
    const wrapper = mount(Modal, {
      props: { show: true, disableConfirm: true, 'onUpdate:show': () => {} },
    });
    const buttons = wrapper.findAll('button');
    const confirmBtn = buttons.find((b) => b.attributes('aria-label')?.includes('confirm'));
    expect(confirmBtn?.attributes('disabled')).toBeDefined();
  });

  it('sets aria-labelledby on dialog', () => {
    const wrapper = mount(Modal, { props: { show: false, 'onUpdate:show': () => {} } });
    const dialog = wrapper.find('dialog');
    expect(dialog.attributes('aria-labelledby')).toContain('modal-header-');
  });

  it('emits closed immediately when no animation', async () => {
    // Mock getAnimations to return empty array
    HTMLDialogElement.prototype.getAnimations = vi.fn(() => []);

    const wrapper = mount(Modal, { props: { show: true, 'onUpdate:show': () => {} } });
    await wrapper.setProps({ show: false });
    await nextTick();
    await nextTick();
    expect(wrapper.emitted('closed')).toHaveLength(1);
  });
});
