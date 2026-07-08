import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { defineComponent, h, shallowRef, nextTick, type ShallowRef } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';
import { useReachedEnd } from '@components/Composable/ReachedEnd';

let wrapper: VueWrapper | undefined;
let intersectCb: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
let observeCount = 0;
let unobserveCount = 0;
const RealIntersectionObserver = globalThis.IntersectionObserver;

beforeEach(() => {
  intersectCb = undefined;
  observeCount = 0;
  unobserveCount = 0;
  globalThis.IntersectionObserver = class {
    constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
      intersectCb = cb;
    }
    observe() {
      observeCount++;
    }
    disconnect() {}
    unobserve() {
      unobserveCount++;
    }
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = '';
    thresholds = [];
  } as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  globalThis.IntersectionObserver = RealIntersectionObserver;
});

function mountHost(options: { container: () => Element | null; scrollOffset: () => number }) {
  const content: ShallowRef<{ replaced: boolean }> = shallowRef({ replaced: false });
  const scrollToOrigin = vi.fn();
  const onReachedEnd = vi.fn();
  const Host = defineComponent({
    setup() {
      const sentinel = shallowRef<Element | null>(null);
      useReachedEnd({
        sentinel,
        container: options.container,
        scrollOffset: options.scrollOffset,
        scrollToOrigin,
        content: () => content.value,
        onReachedEnd,
      });
      return () => h('div', { ref: sentinel });
    },
  });
  wrapper = mount(Host);
  return { content, scrollToOrigin, onReachedEnd };
}

describe('useReachedEnd', () => {
  it('rechecks on a replacement when there is no scroll container to return', async () => {
    const { content, scrollToOrigin, onReachedEnd } = mountHost({
      container: () => null,
      scrollOffset: () => 0,
    });
    await nextTick();
    const observeBefore = observeCount;
    const unobserveBefore = unobserveCount;
    content.value = { replaced: true };
    await nextTick();
    expect(unobserveCount).toBe(unobserveBefore + 1);
    expect(observeCount).toBe(observeBefore + 1);
    expect(scrollToOrigin).not.toHaveBeenCalled();
    intersectCb!([{ isIntersecting: true }]);
    expect(onReachedEnd).toHaveBeenCalledTimes(1);
  });

  it('treats a fractional sub-pixel offset as the origin', async () => {
    const container = document.createElement('div');
    const { content, scrollToOrigin } = mountHost({
      container: () => container,
      scrollOffset: () => 0.6,
    });
    await nextTick();
    const observeBefore = observeCount;
    content.value = { replaced: true };
    await nextTick();
    expect(observeCount).toBe(observeBefore + 1);
    expect(scrollToOrigin).not.toHaveBeenCalled();
  });

  it('settles the return when the offset arrives under one pixel', async () => {
    const container = document.createElement('div');
    let offset = 42;
    const { content, scrollToOrigin, onReachedEnd } = mountHost({
      container: () => container,
      scrollOffset: () => offset,
    });
    await nextTick();
    content.value = { replaced: true };
    await nextTick();
    expect(scrollToOrigin).toHaveBeenCalledTimes(1);
    intersectCb!([{ isIntersecting: true }]);
    expect(onReachedEnd).not.toHaveBeenCalled();
    const observeBefore = observeCount;
    offset = 0.4;
    container.dispatchEvent(new Event('scroll'));
    expect(observeCount).toBe(observeBefore + 1);
    intersectCb!([{ isIntersecting: true }]);
    expect(onReachedEnd).toHaveBeenCalledTimes(1);
  });
});
