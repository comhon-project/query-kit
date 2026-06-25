import { shallowReactive, computed, toRaw, watch, type Ref, type WatchStopHandle } from 'vue';

interface Change {
  before: unknown;
  after: unknown;
}

type Entry = Record<string, Change>;

interface Slice {
  source: Ref<unknown>;
  unwatch: WatchStopHandle;
  lastCommitted: unknown;
  lastEmitted: unknown;
}

export function useHistory() {
  const slices = new Map<string, Slice>();
  const baseline = new Map<string, unknown>();
  const undoStack = shallowReactive<Entry[]>([]);
  const redoStack = shallowReactive<Entry[]>([]);

  const canUndo = computed(() => undoStack.length >= 1);
  const canRedo = computed(() => redoStack.length >= 1);

  function commit(name: string): void {
    const slice = slices.get(name);
    if (!slice) return;
    const raw = toRaw(slice.source.value);
    if (raw === slice.lastEmitted) {
      slice.lastEmitted = null;
      return;
    }
    slice.lastEmitted = null;
    const after = structuredClone(raw);
    undoStack.push({ [name]: { before: slice.lastCommitted, after } });
    redoStack.length = 0;
    slice.lastCommitted = after;
  }

  function write(name: string, value: unknown): void {
    const slice = slices.get(name);
    if (!slice) return;
    const clone = structuredClone(value);
    slice.lastEmitted = clone;
    slice.source.value = clone;
    slice.lastCommitted = value;
  }

  function register<T>(name: string, source: Ref<T>): void {
    if (slices.has(name)) return;
    const value = structuredClone(toRaw(source.value));
    baseline.set(name, value);
    slices.set(name, { source: source as Ref<unknown>, lastCommitted: value, lastEmitted: null, unwatch: watch(source, () => commit(name), { deep: true }) });
  }

  function unregister(name: string): void {
    slices.get(name)?.unwatch();
    slices.delete(name);
    baseline.delete(name);
  }

  function undo(): void {
    if (!canUndo.value) return;
    const entry = undoStack.pop()!;
    redoStack.push(entry);
    for (const name of Object.keys(entry)) write(name, entry[name].before);
  }

  function redo(): void {
    if (!canRedo.value) return;
    const entry = redoStack.pop()!;
    undoStack.push(entry);
    for (const name of Object.keys(entry)) write(name, entry[name].after);
  }

  function reset(): void {
    const entry: Entry = {};
    for (const [name, slice] of slices) {
      const base = baseline.get(name);
      if (slice.lastCommitted !== base) entry[name] = { before: slice.lastCommitted, after: base };
    }
    if (!Object.keys(entry).length) return;
    undoStack.push(entry);
    redoStack.length = 0;
    for (const name of Object.keys(entry)) write(name, entry[name].after);
  }

  function clear(): void {
    undoStack.length = 0;
    redoStack.length = 0;
    for (const [name, slice] of slices) {
      const value = structuredClone(toRaw(slice.source.value));
      baseline.set(name, value);
      slice.lastCommitted = value;
      slice.lastEmitted = null;
    }
  }

  return { register, unregister, undo, redo, reset, clear, canUndo, canRedo };
}

export type History = ReturnType<typeof useHistory>;
