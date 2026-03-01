import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { effectScope, nextTick, type EffectScope } from 'vue';
import { useDragAndDrop } from '@core/useDragAndDrop';

type DragAndDropReturn = ReturnType<typeof useDragAndDrop>;

let scope: EffectScope;
let dnd: DragAndDropReturn;
let moved: [number, number][];
let items: HTMLElement[];

function createKeyboardEvent(key: string, index: number): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  Object.defineProperty(event, 'target', { value: items[index] });
  Object.defineProperty(event, 'currentTarget', { value: items[index] });
  return event;
}

function createDragEvent(type: string, overrides: Partial<DragEvent> = {}): DragEvent {
  const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
  Object.defineProperty(event, 'dataTransfer', {
    value: { effectAllowed: '', dropEffect: '', setData: () => {}, getData: () => '' },
  });
  for (const [key, value] of Object.entries(overrides)) {
    Object.defineProperty(event, key, { value });
  }
  return event;
}

beforeEach(() => {
  moved = [];
  scope = effectScope();
  scope.run(() => {
    dnd = useDragAndDrop({ move: (from, to) => moved.push([from, to]) });
  });
  items = Array.from({ length: 3 }, (_, i) => {
    const el = document.createElement('div');
    el.setAttribute('draggable', 'true');
    el.tabIndex = -1;
    document.body.appendChild(el);
    dnd.setItemRef(el, i);
    return el;
  });
});

afterEach(() => {
  scope.stop();
  items.forEach((el) => el.remove());
});

describe('useDragAndDrop', () => {
  describe('keyboard reorder via onItemKeydown', () => {
    it('Space grabs an item', () => {
      const bindings = dnd.getItemBindings(1);
      bindings.onKeydown(createKeyboardEvent(' ', 1));

      expect(dnd.lastAction.value).toEqual({ type: 'grab', index: 1 });
    });

    it('Enter grabs an item', () => {
      const bindings = dnd.getItemBindings(1);
      bindings.onKeydown(createKeyboardEvent('Enter', 1));

      expect(dnd.lastAction.value).toEqual({ type: 'grab', index: 1 });
    });

    it('Space on grabbed item drops it', () => {
      const bindings = dnd.getItemBindings(1);
      bindings.onKeydown(createKeyboardEvent(' ', 1)); // grab
      bindings.onKeydown(createKeyboardEvent(' ', 1)); // drop

      expect(dnd.lastAction.value).toEqual({ type: 'drop', index: 1 });
    });

    it('Enter on grabbed item drops it', () => {
      const bindings = dnd.getItemBindings(1);
      bindings.onKeydown(createKeyboardEvent('Enter', 1)); // grab
      bindings.onKeydown(createKeyboardEvent('Enter', 1)); // drop

      expect(dnd.lastAction.value).toEqual({ type: 'drop', index: 1 });
    });

    it('ArrowUp on grabbed item moves up', () => {
      const bindings1 = dnd.getItemBindings(1);
      bindings1.onKeydown(createKeyboardEvent(' ', 1)); // grab
      bindings1.onKeydown(createKeyboardEvent('ArrowUp', 1));

      expect(moved).toEqual([[1, 0]]);
      expect(dnd.lastAction.value).toEqual({ type: 'move', index: 0, length: 3 });
    });

    it('ArrowLeft on grabbed item moves up', () => {
      const bindings1 = dnd.getItemBindings(1);
      bindings1.onKeydown(createKeyboardEvent(' ', 1)); // grab
      bindings1.onKeydown(createKeyboardEvent('ArrowLeft', 1));

      expect(moved).toEqual([[1, 0]]);
      expect(dnd.lastAction.value).toEqual({ type: 'move', index: 0, length: 3 });
    });

    it('ArrowDown on grabbed item moves down', () => {
      const bindings1 = dnd.getItemBindings(1);
      bindings1.onKeydown(createKeyboardEvent(' ', 1)); // grab
      bindings1.onKeydown(createKeyboardEvent('ArrowDown', 1));

      expect(moved).toEqual([[1, 2]]);
      expect(dnd.lastAction.value).toEqual({ type: 'move', index: 2, length: 3 });
    });

    it('ArrowRight on grabbed item moves down', () => {
      const bindings1 = dnd.getItemBindings(1);
      bindings1.onKeydown(createKeyboardEvent(' ', 1)); // grab
      bindings1.onKeydown(createKeyboardEvent('ArrowRight', 1));

      expect(moved).toEqual([[1, 2]]);
      expect(dnd.lastAction.value).toEqual({ type: 'move', index: 2, length: 3 });
    });

    it('Escape on grabbed item cancels', () => {
      const bindings1 = dnd.getItemBindings(1);
      bindings1.onKeydown(createKeyboardEvent(' ', 1)); // grab
      bindings1.onKeydown(createKeyboardEvent('Escape', 1));

      expect(dnd.lastAction.value).toEqual({ type: 'cancel' });
    });

    it('ArrowUp at index 0 does nothing', () => {
      const bindings0 = dnd.getItemBindings(0);
      bindings0.onKeydown(createKeyboardEvent(' ', 0)); // grab
      bindings0.onKeydown(createKeyboardEvent('ArrowUp', 0));

      expect(moved).toEqual([]);
      expect(dnd.lastAction.value).toEqual({ type: 'grab', index: 0 });
    });

    it('ArrowDown at last index does nothing', () => {
      const bindings2 = dnd.getItemBindings(2);
      bindings2.onKeydown(createKeyboardEvent(' ', 2)); // grab
      bindings2.onKeydown(createKeyboardEvent('ArrowDown', 2));

      expect(moved).toEqual([]);
      expect(dnd.lastAction.value).toEqual({ type: 'grab', index: 2 });
    });

    it('arrow keys when not grabbed do nothing', () => {
      const bindings1 = dnd.getItemBindings(1);
      bindings1.onKeydown(createKeyboardEvent('ArrowUp', 1));
      bindings1.onKeydown(createKeyboardEvent('ArrowDown', 1));

      expect(moved).toEqual([]);
      expect(dnd.lastAction.value).toBeNull();
    });
  });

  describe('onGripStart', () => {
    it('MouseEvent sets dragFromGrip flag - subsequent DragStart is allowed', () => {
      // Trigger grip with MouseEvent
      dnd.onGripStart(new MouseEvent('mousedown'));

      // DragStart should be allowed (not prevented)
      const dragEvent = createDragEvent('dragstart');
      const preventSpy = vi.spyOn(dragEvent, 'preventDefault');
      const bindings0 = dnd.getItemBindings(0);
      bindings0.onDragstart(dragEvent);

      expect(preventSpy).not.toHaveBeenCalled();
    });

    it('KeyboardEvent with Space grabs item via closest [draggable]', () => {
      // Create a child element inside a draggable item
      const child = document.createElement('span');
      items[1].appendChild(child);

      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: child });

      dnd.onGripStart(event);

      expect(dnd.lastAction.value).toEqual({ type: 'grab', index: 1 });
    });
  });

  describe('native drag and drop', () => {
    it('onDragStart without prior grip MouseEvent calls event.preventDefault', () => {
      const dragEvent = createDragEvent('dragstart');
      const preventSpy = vi.spyOn(dragEvent, 'preventDefault');
      const bindings0 = dnd.getItemBindings(0);
      bindings0.onDragstart(dragEvent);

      expect(preventSpy).toHaveBeenCalled();
    });

    it('onDragStart after grip MouseEvent sets draggedIndex and does not call preventDefault', () => {
      dnd.onGripStart(new MouseEvent('mousedown'));

      const dragEvent = createDragEvent('dragstart');
      const preventSpy = vi.spyOn(dragEvent, 'preventDefault');
      const bindings0 = dnd.getItemBindings(0);
      bindings0.onDragstart(dragEvent);

      expect(preventSpy).not.toHaveBeenCalled();
      // After dragstart, data-dragging should be set on index 0
      const bindingsAfter = dnd.getItemBindings(0);
      expect(bindingsAfter['data-dragging']).toBe(true);
    });

    it('onDragOver sets dragOverIndex when draggedIndex is not null', () => {
      // Start a drag from item 0
      dnd.onGripStart(new MouseEvent('mousedown'));
      const bindings0 = dnd.getItemBindings(0);
      bindings0.onDragstart(createDragEvent('dragstart'));

      // Drag over item 2
      const bindings2 = dnd.getItemBindings(2);
      const dragOverEvent = createDragEvent('dragover');
      bindings2.onDragover(dragOverEvent);

      // Check that data-drag-over is set on item 2
      const updatedBindings2 = dnd.getItemBindings(2);
      expect(updatedBindings2['data-drag-over']).toBe(true);
    });

    it('onDrop calls move callback and resets state', () => {
      // Start a drag from item 0
      dnd.onGripStart(new MouseEvent('mousedown'));
      const bindings0 = dnd.getItemBindings(0);
      bindings0.onDragstart(createDragEvent('dragstart'));

      // Drop on item 2
      const bindings2 = dnd.getItemBindings(2);
      bindings2.onDrop(createDragEvent('drop'));

      expect(moved).toEqual([[0, 1]]);

      // State should be reset
      const afterBindings0 = dnd.getItemBindings(0);
      expect(afterBindings0['data-dragging']).toBeUndefined();
    });

    it('onDragEnd resets state', () => {
      dnd.onGripStart(new MouseEvent('mousedown'));
      const bindings0 = dnd.getItemBindings(0);
      bindings0.onDragstart(createDragEvent('dragstart'));

      // Verify dragging is active
      expect(dnd.getItemBindings(0)['data-dragging']).toBe(true);

      // End drag
      bindings0.onDragend();

      // State should be reset
      expect(dnd.getItemBindings(0)['data-dragging']).toBeUndefined();
    });

    it('onDragLeave clears dragOverIndex', () => {
      // Start a drag from item 0
      dnd.onGripStart(new MouseEvent('mousedown'));
      const bindings0 = dnd.getItemBindings(0);
      bindings0.onDragstart(createDragEvent('dragstart'));

      // Drag over item 2
      const bindings2 = dnd.getItemBindings(2);
      bindings2.onDragover(createDragEvent('dragover'));

      // Verify drag over is set
      expect(dnd.getItemBindings(2)['data-drag-over']).toBe(true);

      // Drag leave item 2 (relatedTarget outside currentTarget)
      const leaveEvent = createDragEvent('dragleave', {
        relatedTarget: document.body,
        currentTarget: items[2],
      } as any);
      bindings2.onDragleave(leaveEvent);

      // dragOverIndex should be cleared
      expect(dnd.getItemBindings(2)['data-drag-over']).toBeUndefined();
    });
  });

  describe('binding helpers', () => {
    it('getItemBindings returns draggable:true, tabindex:-1, and event handlers', () => {
      const bindings = dnd.getItemBindings(0);

      expect(bindings.draggable).toBe(true);
      expect(bindings.tabindex).toBe(-1);
      expect(typeof bindings.onKeydown).toBe('function');
      expect(typeof bindings.onDragstart).toBe('function');
      expect(typeof bindings.onDragend).toBe('function');
      expect(typeof bindings.onDragover).toBe('function');
      expect(typeof bindings.onDragleave).toBe('function');
      expect(typeof bindings.onDrop).toBe('function');
      expect(typeof bindings.onFocusout).toBe('function');
    });

    it('setItemRef with null removes ref', () => {
      // Initially 3 items. Remove item at index 1.
      dnd.setItemRef(null, 1);

      // Grab item at index 0 and try to move down - should still work
      // but itemRefs.length is now 2 (the splice removed one)
      const bindings0 = dnd.getItemBindings(0);
      bindings0.onKeydown(createKeyboardEvent(' ', 0)); // grab
      bindings0.onKeydown(createKeyboardEvent('ArrowDown', 0));

      // The move happened with the updated length
      expect(moved).toEqual([[0, 1]]);
    });
  });

  describe('getDropZoneBindings', () => {
    it('returns bindings for drop zone (index = items.length)', () => {
      const dropZoneBindings = dnd.getDropZoneBindings();

      expect(typeof dropZoneBindings.onDragover).toBe('function');
      expect(typeof dropZoneBindings.onDragleave).toBe('function');
      expect(typeof dropZoneBindings.onDrop).toBe('function');

      // Start a drag and drop on the drop zone
      dnd.onGripStart(new MouseEvent('mousedown'));
      const bindings0 = dnd.getItemBindings(0);
      bindings0.onDragstart(createDragEvent('dragstart'));

      // Drop on the drop zone (index = 3, which is items.length)
      const dropEvent = createDragEvent('drop');
      dropZoneBindings.onDrop(dropEvent);

      // from=0, index=3 >= length(3), so to = length - 1 = 2
      expect(moved).toEqual([[0, 2]]);
    });
  });
});
