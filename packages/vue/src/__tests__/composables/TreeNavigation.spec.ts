import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useTreeNavigation } from '@components/Filter/Composable/TreeNavigation';

/**
 * Build a DOM tree like:
 * <div role="tree">
 *   <div role="treeitem" aria-expanded="true">Item 1
 *     <div role="group">
 *       <div role="treeitem">Item 1.1</div>
 *       <div role="treeitem">Item 1.2</div>
 *     </div>
 *   </div>
 *   <div role="treeitem" aria-expanded="false">Item 2
 *     <div role="group">
 *       <div role="treeitem">Item 2.1 (hidden)</div>
 *     </div>
 *   </div>
 *   <div role="treeitem">Item 3</div>
 * </div>
 */
function buildTree(): { tree: HTMLElement; items: Record<string, HTMLElement> } {
  const tree = document.createElement('div');
  tree.setAttribute('role', 'tree');

  // Item 1 (expanded, has children)
  const item1 = document.createElement('div');
  item1.setAttribute('role', 'treeitem');
  item1.setAttribute('aria-expanded', 'true');
  item1.textContent = 'Item 1';

  const group1 = document.createElement('div');
  group1.setAttribute('role', 'group');

  const item11 = document.createElement('div');
  item11.setAttribute('role', 'treeitem');
  item11.textContent = 'Item 1.1';

  const item12 = document.createElement('div');
  item12.setAttribute('role', 'treeitem');
  item12.textContent = 'Item 1.2';

  group1.appendChild(item11);
  group1.appendChild(item12);
  item1.appendChild(group1);

  // Item 2 (collapsed, has hidden children)
  const item2 = document.createElement('div');
  item2.setAttribute('role', 'treeitem');
  item2.setAttribute('aria-expanded', 'false');
  item2.textContent = 'Item 2';

  const group2 = document.createElement('div');
  group2.setAttribute('role', 'group');

  const item21 = document.createElement('div');
  item21.setAttribute('role', 'treeitem');
  item21.textContent = 'Item 2.1';

  group2.appendChild(item21);
  item2.appendChild(group2);

  // Item 3 (no children, no aria-expanded)
  const item3 = document.createElement('div');
  item3.setAttribute('role', 'treeitem');
  item3.textContent = 'Item 3';

  tree.appendChild(item1);
  tree.appendChild(item2);
  tree.appendChild(item3);

  document.body.appendChild(tree);

  return {
    tree,
    items: { item1, item11, item12, item2, item21, item3 },
  };
}

function fireKey(target: HTMLElement, key: string, opts: Partial<KeyboardEvent> = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts });
  target.dispatchEvent(event);
  return event;
}

describe('useTreeNavigation', () => {
  let tree: HTMLElement;
  let items: Record<string, HTMLElement>;

  beforeEach(() => {
    document.body.innerHTML = '';
    const built = buildTree();
    tree = built.tree;
    items = built.items;
  });

  describe('initTabindex', () => {
    it('sets all items to -1 and first to 0', () => {
      const treeRef = ref(tree);
      const { initTabindex } = useTreeNavigation(treeRef);

      initTabindex();

      // Visible items: item1, item11, item12, item2, item3 (item21 is in collapsed parent)
      expect(items.item1.getAttribute('tabindex')).toBe('0');
      expect(items.item11.getAttribute('tabindex')).toBe('-1');
      expect(items.item12.getAttribute('tabindex')).toBe('-1');
      expect(items.item2.getAttribute('tabindex')).toBe('-1');
      expect(items.item3.getAttribute('tabindex')).toBe('-1');
    });

    it('does nothing if treeRef is null', () => {
      const treeRef = ref<HTMLElement | null>(null);
      const { initTabindex } = useTreeNavigation(treeRef);

      // Should not throw
      initTabindex();
    });
  });

  describe('ArrowDown / ArrowUp', () => {
    it('ArrowDown moves focus to next visible item', () => {
      const treeRef = ref(tree);
      const { initTabindex, handleKeydown } = useTreeNavigation(treeRef);
      initTabindex();

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: items.item1 });
      handleKeydown(event);

      expect(items.item11.getAttribute('tabindex')).toBe('0');
      expect(items.item1.getAttribute('tabindex')).toBe('-1');
    });

    it('ArrowUp moves focus to previous visible item', () => {
      const treeRef = ref(tree);
      const { initTabindex, handleKeydown } = useTreeNavigation(treeRef);
      initTabindex();

      // Focus item11, ArrowUp should go to item1
      items.item11.setAttribute('tabindex', '0');
      items.item1.setAttribute('tabindex', '-1');

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: items.item11 });
      handleKeydown(event);

      expect(items.item1.getAttribute('tabindex')).toBe('0');
      expect(items.item11.getAttribute('tabindex')).toBe('-1');
    });

    it('ArrowDown with Ctrl navigates siblings only', () => {
      const treeRef = ref(tree);
      const { initTabindex, handleKeydown } = useTreeNavigation(treeRef);
      initTabindex();

      // item11 and item12 are siblings in group1
      items.item11.setAttribute('tabindex', '0');
      items.item1.setAttribute('tabindex', '-1');

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: items.item11 });
      handleKeydown(event);

      expect(items.item12.getAttribute('tabindex')).toBe('0');
      expect(items.item11.getAttribute('tabindex')).toBe('-1');
    });

    it('does not move past the last visible item', () => {
      const treeRef = ref(tree);
      const { initTabindex, handleKeydown } = useTreeNavigation(treeRef);
      initTabindex();

      // item3 is the last visible item
      items.item3.setAttribute('tabindex', '0');
      items.item1.setAttribute('tabindex', '-1');

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: items.item3 });
      handleKeydown(event);

      expect(items.item3.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('Home / End', () => {
    it('Home focuses first visible item', () => {
      const treeRef = ref(tree);
      const { initTabindex, handleKeydown } = useTreeNavigation(treeRef);
      initTabindex();

      items.item3.setAttribute('tabindex', '0');
      items.item1.setAttribute('tabindex', '-1');

      const event = new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: items.item3 });
      handleKeydown(event);

      expect(items.item1.getAttribute('tabindex')).toBe('0');
      expect(items.item3.getAttribute('tabindex')).toBe('-1');
    });

    it('End focuses last visible item', () => {
      const treeRef = ref(tree);
      const { initTabindex, handleKeydown } = useTreeNavigation(treeRef);
      initTabindex();

      const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: items.item1 });
      handleKeydown(event);

      expect(items.item3.getAttribute('tabindex')).toBe('0');
      expect(items.item1.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('PageUp / PageDown', () => {
    it('PageUp focuses first sibling', () => {
      const treeRef = ref(tree);
      const { initTabindex, handleKeydown } = useTreeNavigation(treeRef);
      initTabindex();

      items.item12.setAttribute('tabindex', '0');
      items.item1.setAttribute('tabindex', '-1');

      const event = new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: items.item12 });
      handleKeydown(event);

      expect(items.item11.getAttribute('tabindex')).toBe('0');
      expect(items.item12.getAttribute('tabindex')).toBe('-1');
    });

    it('PageDown focuses last sibling', () => {
      const treeRef = ref(tree);
      const { initTabindex, handleKeydown } = useTreeNavigation(treeRef);
      initTabindex();

      items.item11.setAttribute('tabindex', '0');
      items.item1.setAttribute('tabindex', '-1');

      const event = new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: items.item11 });
      handleKeydown(event);

      expect(items.item12.getAttribute('tabindex')).toBe('0');
      expect(items.item11.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('ArrowRight', () => {
    it('dispatches tree-toggle on collapsed item', () => {
      const treeRef = ref(tree);
      const { handleKeydown } = useTreeNavigation(treeRef);

      const handler = vi.fn();
      items.item2.addEventListener('tree-toggle', handler);

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: items.item2 });
      handleKeydown(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('focuses first child on expanded item', () => {
      const treeRef = ref(tree);
      const { initTabindex, handleKeydown } = useTreeNavigation(treeRef);
      initTabindex();

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: items.item1 });
      handleKeydown(event);

      expect(items.item11.getAttribute('tabindex')).toBe('0');
      expect(items.item1.getAttribute('tabindex')).toBe('-1');
    });

    it('does nothing on item without children or aria-expanded', () => {
      const treeRef = ref(tree);
      const { initTabindex, handleKeydown } = useTreeNavigation(treeRef);
      initTabindex();

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: items.item3 });
      handleKeydown(event);

      // item3 has no aria-expanded, so nothing should happen
      expect(items.item3.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('ArrowLeft', () => {
    it('dispatches tree-toggle on expanded item', () => {
      const treeRef = ref(tree);
      const { handleKeydown } = useTreeNavigation(treeRef);

      const handler = vi.fn();
      items.item1.addEventListener('tree-toggle', handler);

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: items.item1 });
      handleKeydown(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('focuses parent item on collapsed/no-expanded item', () => {
      const treeRef = ref(tree);
      const { initTabindex, handleKeydown } = useTreeNavigation(treeRef);
      initTabindex();

      items.item11.setAttribute('tabindex', '0');
      items.item1.setAttribute('tabindex', '-1');

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: items.item11 });
      handleKeydown(event);

      expect(items.item1.getAttribute('tabindex')).toBe('0');
      expect(items.item11.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('Escape', () => {
    it('focuses parent treeitem from a nested form element', () => {
      const treeRef = ref(tree);
      const { initTabindex, handleKeydown } = useTreeNavigation(treeRef);
      initTabindex();

      // Add an input inside item11
      const input = document.createElement('input');
      items.item11.appendChild(input);

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: input });
      handleKeydown(event);

      // The focus should move to the treeitem containing the input
      // Since input is inside item11, the closest treeitem is item11
      // And since eventTarget !== target (input !== item11), it should focus item11
    });

    it('focuses parent item from a child treeitem', () => {
      const treeRef = ref(tree);
      const { initTabindex, handleKeydown } = useTreeNavigation(treeRef);
      initTabindex();

      items.item11.setAttribute('tabindex', '0');
      items.item1.setAttribute('tabindex', '-1');

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: items.item11 });
      handleKeydown(event);

      expect(items.item1.getAttribute('tabindex')).toBe('0');
      expect(items.item11.getAttribute('tabindex')).toBe('-1');
    });

    it('calls onExit when at root level', () => {
      const treeRef = ref(tree);
      const onExit = vi.fn();
      const { initTabindex, handleKeydown } = useTreeNavigation(treeRef, onExit);
      initTabindex();

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: items.item1 });
      handleKeydown(event);

      expect(onExit).toHaveBeenCalledTimes(1);
    });
  });

  describe('early exits', () => {
    it('does nothing if treeRef is null', () => {
      const treeRef = ref<HTMLElement | null>(null);
      const { handleKeydown } = useTreeNavigation(treeRef);

      // Should not throw
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      handleKeydown(event);
    });

    it('ignores events inside a dialog', () => {
      const treeRef = ref(tree);
      const { initTabindex, handleKeydown } = useTreeNavigation(treeRef);
      initTabindex();

      const dialog = document.createElement('dialog');
      const button = document.createElement('button');
      dialog.appendChild(button);
      items.item1.appendChild(dialog);

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: button });
      handleKeydown(event);

      // item1 should still have tabindex 0
      expect(items.item1.getAttribute('tabindex')).toBe('0');
    });

    it('ignores form elements except Escape', () => {
      const treeRef = ref(tree);
      const { initTabindex, handleKeydown } = useTreeNavigation(treeRef);
      initTabindex();

      const input = document.createElement('input');
      items.item1.appendChild(input);

      // ArrowDown on input should be ignored
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
      Object.defineProperty(downEvent, 'target', { value: input });
      handleKeydown(downEvent);

      expect(items.item1.getAttribute('tabindex')).toBe('0');
    });

    it('ignores events on elements not in visible items', () => {
      const treeRef = ref(tree);
      const { initTabindex, handleKeydown } = useTreeNavigation(treeRef);
      initTabindex();

      // item21 is inside collapsed item2, so not visible
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: items.item21 });
      handleKeydown(event);

      // Nothing should change
      expect(items.item1.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('collapsed parent hides children', () => {
    it('children of collapsed items are not in visible items', () => {
      const treeRef = ref(tree);
      const { initTabindex, handleKeydown } = useTreeNavigation(treeRef);
      initTabindex();

      // Navigate with End — should reach item3, not item21
      const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: items.item1 });
      handleKeydown(event);

      expect(items.item3.getAttribute('tabindex')).toBe('0');
    });
  });
});
