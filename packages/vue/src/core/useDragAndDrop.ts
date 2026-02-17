import { ref, nextTick } from 'vue';

export type DragAndDropAction =
  | { type: 'grab'; index: number }
  | { type: 'drop'; index: number }
  | { type: 'move'; index: number; length: number }
  | { type: 'cancel' };

interface UseDragAndDropOptions {
  move: (from: number, to: number) => void;
}

export function useDragAndDrop(options: UseDragAndDropOptions) {
  const draggedIndex = ref<number | null>(null);
  const dragOverIndex = ref<number | null>(null);
  const grabbedIndex = ref<number | null>(null);
  const lastAction = ref<DragAndDropAction | null>(null);
  const itemRefs: HTMLElement[] = [];
  let dragFromGrip = false;

  function focusItem(index: number): void {
    itemRefs[index]?.focus();
  }

  function onGripStart(event: Event): void {
    if (event instanceof MouseEvent) {
      dragFromGrip = true;
    } else if (event instanceof KeyboardEvent && (event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault();
      const draggable = (event.target as HTMLElement).closest('[draggable]');
      if (!draggable) return;
      const index = itemRefs.indexOf(draggable as HTMLElement);
      if (index !== -1) {
        grabbedIndex.value = index;
        lastAction.value = { type: 'grab', index };
        nextTick(() => focusItem(index));
      }
    }
  }

  // Native drag and drop

  function onDragStart(event: DragEvent, index: number): void {
    if (!dragFromGrip) {
      event.preventDefault();
      return;
    }
    dragFromGrip = false;
    grabbedIndex.value = null;
    draggedIndex.value = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  function onDragOver(event: DragEvent, index: number): void {
    if (draggedIndex.value === null) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    dragOverIndex.value = index;
  }

  function onDragLeave(event: DragEvent, index: number): void {
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    if (relatedTarget && (event.currentTarget as HTMLElement).contains(relatedTarget)) return;
    if (dragOverIndex.value === index) {
      dragOverIndex.value = null;
    }
  }

  function onDrop(event: DragEvent, index: number): void {
    event.preventDefault();
    const length = itemRefs.length;
    if (draggedIndex.value !== null && draggedIndex.value !== index) {
      const from = draggedIndex.value;
      let to: number;
      if (index >= length) {
        to = length - 1;
      } else if (from < index) {
        to = index - 1;
      } else {
        to = index;
      }
      options.move(from, to);
    }
    draggedIndex.value = null;
    dragOverIndex.value = null;
  }

  function onDragEnd(): void {
    draggedIndex.value = null;
    dragOverIndex.value = null;
    dragFromGrip = false;
  }

  // Keyboard reorder

  function onItemKeydown(event: KeyboardEvent, index: number): void {
    const isGrabbed = grabbedIndex.value === index;

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (isGrabbed) {
        grabbedIndex.value = null;
        lastAction.value = { type: 'drop', index };
      } else {
        grabbedIndex.value = index;
        lastAction.value = { type: 'grab', index };
      }
      return;
    }

    if (event.key === 'Escape' && grabbedIndex.value !== null) {
      event.preventDefault();
      grabbedIndex.value = null;
      lastAction.value = { type: 'cancel' };
      return;
    }

    if (isGrabbed) {
      const length = itemRefs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (index > 0) {
          options.move(index, index - 1);
          grabbedIndex.value = index - 1;
          lastAction.value = { type: 'move', index: index - 1, length };
          nextTick(() => focusItem(index - 1));
        }
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        if (index < length - 1) {
          options.move(index, index + 1);
          grabbedIndex.value = index + 1;
          lastAction.value = { type: 'move', index: index + 1, length };
          nextTick(() => focusItem(index + 1));
        }
      }
    }
  }

  // Binding helpers

  function setItemRef(el: HTMLElement | null, index: number): void {
    if (el) itemRefs[index] = el;
    else itemRefs.splice(index, 1);
  }

  function getDropTargetBindings(index: number) {
    return {
      'data-drag-over':
        (dragOverIndex.value === index && draggedIndex.value !== null && draggedIndex.value !== index) || undefined,
      onDragover: (e: DragEvent) => onDragOver(e, index),
      onDragleave: (e: DragEvent) => onDragLeave(e, index),
      onDrop: (e: DragEvent) => onDrop(e, index),
    };
  }

  function onItemFocusout(): void {
    if (grabbedIndex.value !== null) {
      nextTick(() => {
        if (itemRefs.includes(document.activeElement as HTMLElement)) return;
        grabbedIndex.value = null;
      });
    }
  }

  function getItemBindings(index: number) {
    return {
      ...getDropTargetBindings(index),
      'data-dragging': draggedIndex.value === index || undefined,
      'data-grabbed': grabbedIndex.value === index || undefined,
      tabindex: -1,
      draggable: true as const,
      onKeydown: (e: KeyboardEvent) => {
        if (e.target === e.currentTarget) onItemKeydown(e, index);
      },
      onFocusout: onItemFocusout,
      onDragstart: (e: DragEvent) => onDragStart(e, index),
      onDragend: () => onDragEnd(),
    };
  }

  function getDropZoneBindings() {
    return getDropTargetBindings(itemRefs.length);
  }

  return {
    lastAction,
    onGripStart,
    setItemRef,
    getItemBindings,
    getDropZoneBindings,
  };
}
