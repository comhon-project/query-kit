import { ref, watch, toRaw, onScopeDispose, getCurrentScope, type Ref } from 'vue';

export interface InternalModelOptions<TExternal, TInternal> {
  /** External → internal, e.g. add keys. Defaults to a deep clone. */
  normalize?: (value: TExternal) => TInternal;
  /** Internal → external, e.g. strip the added keys. Defaults to a deep clone. */
  strip?: (value: TInternal) => TExternal;
  /** Debounce outbound emits (ms). Number (incl. 0) defers; null/undefined emits synchronously. */
  debounce?: number | null;
}

/**
 * Keeps an internal working copy in sync with a `defineModel` ref, applying
 * `normalize` inbound and `strip` outbound. Mutating or reassigning the internal
 * ref propagates; our own emit is suppressed on the way back in.
 *
 * Echo suppression works by reference identity, which implies two contracts on
 * the external `model`:
 * 1. External changes must arrive as a NEW reference (a reassignment). The
 *    inbound watch is not deep, so an in-place mutation of the existing model
 *    object is not detected and will not sync into `internal`.
 * 2. Never reinject a reference that was previously emitted from here (e.g. an
 *    undo/redo that restores a snapshot without cloning). It is indistinguishable
 *    from our own echo and will be silently ignored. Clone such snapshots first.
 */
export function useInternalModel<TExternal, TInternal = TExternal>(
  model: Ref<TExternal>,
  options: InternalModelOptions<TExternal, TInternal> = {},
): Ref<TInternal> {
  const normalize = options?.normalize ?? ((value) => clone(value) as unknown as TInternal);
  const strip = options?.strip ?? ((value) => clone(value) as unknown as TExternal);
  const debounceMs = options?.debounce;
  const shouldDebounce = typeof debounceMs === 'number';

  const EMPTY = Symbol();
  const internal = ref<TInternal>(null!) as Ref<TInternal>;
  let lastEmitted: TExternal | typeof EMPTY = EMPTY;
  let lastNormalized: TInternal | typeof EMPTY = EMPTY;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function emit() {
    timer = null;
    const emitted = strip(toRaw(internal.value) as TInternal);
    lastEmitted = emitted;
    model.value = emitted;
  }

  watch(
    model,
    (value) => {
      if (toRaw(value) === lastEmitted) return; // our own emit bouncing back
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastNormalized = normalize(toRaw(value) as TExternal);
      internal.value = lastNormalized;
    },
    { immediate: true },
  );

  watch(
    internal,
    (newVal, oldVal) => {
      const raw = toRaw(newVal);
      // Skip the reassignment driven by our inbound watch; guarded on identity
      // change so in-place mutations of that same value still emit.
      if (raw !== toRaw(oldVal) && raw === lastNormalized) return;
      if (shouldDebounce) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(emit, debounceMs);
      } else {
        emit();
      }
    },
    { deep: true },
  );

  if (getCurrentScope()) {
    onScopeDispose(() => timer && clearTimeout(timer));
  }

  return internal;
}

function clone<T>(value: T): T {
  return structuredClone(toRaw(value));
}
