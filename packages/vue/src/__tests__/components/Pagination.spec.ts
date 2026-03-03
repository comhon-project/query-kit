import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import Pagination from '@components/Pagination/Pagination.vue';
import { locale, loadedTranslations } from '@i18n/i18n';

describe('Pagination', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders page 1 button always', () => {
    const wrapper = mount(Pagination, {
      props: { modelValue: 1, count: 5, 'onUpdate:modelValue': () => {} },
    });
    const buttons = wrapper.findAll('button');
    expect(buttons.some((b) => b.text() === '1')).toBe(true);
  });

  it('renders last page button when count > 1', () => {
    const wrapper = mount(Pagination, {
      props: { modelValue: 1, count: 5, 'onUpdate:modelValue': () => {} },
    });
    const buttons = wrapper.findAll('button');
    expect(buttons.some((b) => b.text() === '5')).toBe(true);
  });

  it('does not render last page button when count is 1', () => {
    const wrapper = mount(Pagination, {
      props: { modelValue: 1, count: 1, 'onUpdate:modelValue': () => {} },
    });
    const pageButtons = wrapper.findAll('button').filter((b) => /^\d+$/.test(b.text()));
    expect(pageButtons).toHaveLength(1);
    expect(pageButtons[0].text()).toBe('1');
  });

  it('renders near pages around current page', () => {
    const wrapper = mount(Pagination, {
      props: { modelValue: 5, count: 10, 'onUpdate:modelValue': () => {} },
    });
    const pageButtons = wrapper.findAll('button').filter((b) => /^\d+$/.test(b.text()));
    const pages = pageButtons.map((b) => Number(b.text()));
    // Should include 1, 3, 4, 5, 6, 7, 10
    expect(pages).toContain(3);
    expect(pages).toContain(4);
    expect(pages).toContain(5);
    expect(pages).toContain(6);
    expect(pages).toContain(7);
  });

  it('shows start ellipsis when currentPage > 4', () => {
    const wrapper = mount(Pagination, {
      props: { modelValue: 6, count: 10, 'onUpdate:modelValue': () => {} },
    });
    const items = wrapper.findAll('li');
    const ellipsisItems = items.filter((li) => li.text() === '...');
    expect(ellipsisItems.length).toBeGreaterThanOrEqual(1);
  });

  it('shows end ellipsis when currentPage < count - 3', () => {
    const wrapper = mount(Pagination, {
      props: { modelValue: 1, count: 10, 'onUpdate:modelValue': () => {} },
    });
    const items = wrapper.findAll('li');
    const ellipsisItems = items.filter((li) => li.text() === '...');
    expect(ellipsisItems.length).toBeGreaterThanOrEqual(1);
  });

  it('marks current page with aria-current="page"', () => {
    const wrapper = mount(Pagination, {
      props: { modelValue: 3, count: 10, 'onUpdate:modelValue': () => {} },
    });
    const currentBtn = wrapper.find('button[aria-current="page"]');
    expect(currentBtn.exists()).toBe(true);
    expect(currentBtn.text()).toBe('3');
  });

  it('debounces page updates (500ms)', async () => {
    const onUpdate = vi.fn();
    const wrapper = mount(Pagination, {
      props: { modelValue: 1, count: 10, 'onUpdate:modelValue': onUpdate },
    });

    // Click page 3
    const page3 = wrapper.findAll('button').find((b) => b.text() === '3');
    await page3!.trigger('click');

    // Should not have emitted yet
    expect(onUpdate).not.toHaveBeenCalled();

    // Advance timer
    vi.advanceTimersByTime(500);
    expect(onUpdate).toHaveBeenCalledWith(3);
  });

  it('disables previous button on page 1', () => {
    const wrapper = mount(Pagination, {
      props: { modelValue: 1, count: 5, 'onUpdate:modelValue': () => {} },
    });
    const prevBtn = wrapper.findAll('button')[0];
    expect(prevBtn.attributes('disabled')).toBeDefined();
  });

  it('disables next button on last page', () => {
    const wrapper = mount(Pagination, {
      props: { modelValue: 5, count: 5, 'onUpdate:modelValue': () => {} },
    });
    const buttons = wrapper.findAll('button');
    const nextBtn = buttons[buttons.length - 1];
    expect(nextBtn.attributes('disabled')).toBeDefined();
  });

  it('disables both buttons when locked', () => {
    const wrapper = mount(Pagination, {
      props: { modelValue: 3, count: 5, lock: true, 'onUpdate:modelValue': () => {} },
    });
    const buttons = wrapper.findAll('button');
    const prevBtn = buttons[0];
    const nextBtn = buttons[buttons.length - 1];
    expect(prevBtn.attributes('disabled')).toBeDefined();
    expect(nextBtn.attributes('disabled')).toBeDefined();
  });

  it('does not update modelValue when locked', async () => {
    const onUpdate = vi.fn();
    const wrapper = mount(Pagination, {
      props: { modelValue: 3, count: 5, lock: true, 'onUpdate:modelValue': onUpdate },
    });

    const page1 = wrapper.findAll('button').find((b) => b.text() === '1');
    await page1!.trigger('click');
    vi.advanceTimersByTime(500);

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('reverts currentPage if locked during debounce', async () => {
    const onUpdate = vi.fn();
    const wrapper = mount(Pagination, {
      props: { modelValue: 3, count: 10, lock: false, 'onUpdate:modelValue': onUpdate },
    });

    // Click page 5
    const page5 = wrapper.findAll('button').find((b) => b.text() === '5');
    await page5!.trigger('click');

    // Lock before debounce fires
    await wrapper.setProps({ lock: true });
    vi.advanceTimersByTime(500);

    // Should not update and should revert
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('renders nav with pagination aria-label', () => {
    const wrapper = mount(Pagination, {
      props: { modelValue: 1, count: 5, 'onUpdate:modelValue': () => {} },
    });
    expect(wrapper.find('nav').attributes('aria-label')).toBe('pagination');
  });

  it('updates translations when locale changes', async () => {
    const wrapper = mount(Pagination, {
      props: { modelValue: 1, count: 5, 'onUpdate:modelValue': () => {} },
    });
    expect(wrapper.find('nav').attributes('aria-label')).toBe('pagination');

    loadedTranslations['fr'] = { pagination: 'navigation par pages', page: 'page' };
    locale.value = 'fr';
    await nextTick();

    expect(wrapper.find('nav').attributes('aria-label')).toBe('navigation par pages');
  });

  it('navigates to previous page when button clicked', async () => {
    const onUpdate = vi.fn();
    const wrapper = mount(Pagination, {
      props: { modelValue: 3, count: 5, 'onUpdate:modelValue': onUpdate },
    });
    const prevBtn = wrapper.findAll('button')[0];
    await prevBtn.trigger('click');
    vi.advanceTimersByTime(500);
    expect(onUpdate).toHaveBeenCalledWith(2);
  });

  it('navigates to next page when button clicked', async () => {
    const onUpdate = vi.fn();
    const wrapper = mount(Pagination, {
      props: { modelValue: 1, count: 5, 'onUpdate:modelValue': onUpdate },
    });
    const buttons = wrapper.findAll('button');
    const nextBtn = buttons[buttons.length - 1];
    await nextBtn.trigger('click');
    vi.advanceTimersByTime(500);
    expect(onUpdate).toHaveBeenCalledWith(2);
  });

  it('does not show ellipsis when pages fit without gap (count=5, page=3)', () => {
    const wrapper = mount(Pagination, {
      props: { modelValue: 3, count: 5, 'onUpdate:modelValue': () => {} },
    });
    const items = wrapper.findAll('li');
    const ellipsisItems = items.filter((li) => li.text() === '...');
    expect(ellipsisItems.length).toBe(0);
  });

  it('shows both ellipses when current page is in the middle of a large range', () => {
    const wrapper = mount(Pagination, {
      props: { modelValue: 10, count: 20, 'onUpdate:modelValue': () => {} },
    });
    const items = wrapper.findAll('li');
    const ellipsisItems = items.filter((li) => li.text() === '...');
    expect(ellipsisItems.length).toBe(2);
  });

  it('handles count=2 correctly', () => {
    const wrapper = mount(Pagination, {
      props: { modelValue: 1, count: 2, 'onUpdate:modelValue': () => {} },
    });
    const pageButtons = wrapper.findAll('button').filter((b) => /^\d+$/.test(b.text()));
    expect(pageButtons).toHaveLength(2);
    expect(pageButtons[0].text()).toBe('1');
    expect(pageButtons[1].text()).toBe('2');
    // No ellipsis
    const items = wrapper.findAll('li');
    const ellipsisItems = items.filter((li) => li.text() === '...');
    expect(ellipsisItems.length).toBe(0);
  });
});
