import { ref, computed, toRaw } from 'vue';
import type { GroupFilter } from '@core/types';

export function useHistory() {
  const undoStack = ref<GroupFilter[]>([]);
  const redoStack = ref<GroupFilter[]>([]);
  // When undo/redo restores a state, it updates internalModel which triggers
  // the deep watcher → scheduleEmit → pushSnapshot. Without this flag, the
  // restored state would be recorded as a new history entry, corrupting both stacks.
  // undo/redo sets the flag to true; pushSnapshot checks it, skips recording, and resets it.
  let isUndoRedoInProgress = false;

  const canUndo = computed(() => undoStack.value.length >= 2);
  const canRedo = computed(() => redoStack.value.length >= 1);

  function pushSnapshot(state: GroupFilter): void {
    if (isUndoRedoInProgress) {
      isUndoRedoInProgress = false;
      return;
    }
    undoStack.value.push(structuredClone(toRaw(state)));
    redoStack.value = [];
  }

  function undo(): GroupFilter | null {
    if (!canUndo.value) return null;
    isUndoRedoInProgress = true;
    const current = undoStack.value.pop()!;
    redoStack.value.push(current);
    return structuredClone(toRaw(undoStack.value.at(-1)!));
  }

  function redo(): GroupFilter | null {
    if (!canRedo.value) return null;
    isUndoRedoInProgress = true;
    const state = redoStack.value.pop()!;
    undoStack.value.push(state);
    return structuredClone(toRaw(state));
  }

  function clearHistory(): void {
    undoStack.value = [];
    redoStack.value = [];
  }

  return { pushSnapshot, undo, redo, canUndo, canRedo, clearHistory };
}
