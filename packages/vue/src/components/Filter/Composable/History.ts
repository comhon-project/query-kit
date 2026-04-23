import { ref, computed, toRaw } from 'vue';
import type { GroupFilter } from '@core/types';

export function useHistory() {
  const undoStack = ref<GroupFilter[]>([]);
  const redoStack = ref<GroupFilter[]>([]);
  // Tracks the reference returned by undo/redo, so a hypothetical watcher
  // on the consumer side that calls pushSnapshot with it does not record it.
  let lastEmitted: GroupFilter | null = null;

  const canUndo = computed(() => undoStack.value.length >= 2);
  const canRedo = computed(() => redoStack.value.length >= 1);

  function pushSnapshot(state: GroupFilter): void {
    const raw = toRaw(state);
    if (raw === lastEmitted) {
      lastEmitted = null;
      return;
    }
    undoStack.value.push(structuredClone(raw));
    redoStack.value = [];
  }

  function undo(): GroupFilter | null {
    if (!canUndo.value) return null;
    const current = undoStack.value.pop()!;
    redoStack.value.push(current);
    lastEmitted = structuredClone(toRaw(undoStack.value.at(-1)!));
    return lastEmitted;
  }

  function redo(): GroupFilter | null {
    if (!canRedo.value) return null;
    const state = redoStack.value.pop()!;
    undoStack.value.push(state);
    lastEmitted = structuredClone(toRaw(state));
    return lastEmitted;
  }

  function clearHistory(): void {
    undoStack.value = [];
    redoStack.value = [];
    lastEmitted = null;
  }

  return { pushSnapshot, undo, redo, canUndo, canRedo, clearHistory };
}
