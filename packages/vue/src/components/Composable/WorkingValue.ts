import { ref, watch, onScopeDispose, getCurrentScope, type Ref } from 'vue';

export interface WorkingValueOptions<T> {
  /** Applied to the value before it is written to `source` (e.g. trim). The returned ref stays raw. */
  transform?: (value: T) => T;
  /** Debounce delay in ms for the write to `source`. Omitted = synchronous. */
  delay?: number;
}

/**
 * Working copy of `source` for an `<input>`: the returned ref keeps the raw edited value, writes to
 * `source` are transformed and (optionally) debounced, and an external change resyncs it (our own echo
 * doesn't). With neither a transform nor a delay, returns `source` unchanged.
 */
export function useWorkingValue<T>(source: Ref<T>, options: WorkingValueOptions<T> = {}): Ref<T> {
  const { transform, delay } = options;
  if (transform == null && delay == null) return source;

  const apply = transform ?? ((value) => value);
  const workingValue = ref(source.value) as Ref<T>;
  let timer: ReturnType<typeof setTimeout> | undefined;

  watch(source, (value) => {
    if (apply(workingValue.value) !== value) workingValue.value = value;
  });

  watch(workingValue, (value) => {
    const out = apply(value);
    if (timer) clearTimeout(timer);
    if (out === source.value) return;
    if (delay == null) {
      source.value = out;
    } else {
      timer = setTimeout(() => (source.value = out), delay);
    }
  });

  if (getCurrentScope()) {
    onScopeDispose(() => {
      if (timer) clearTimeout(timer);
    });
  }

  return workingValue;
}
