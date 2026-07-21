import { ref, watch, toRaw, onScopeDispose, getCurrentScope, type Ref } from 'vue';

export interface InternalModelOptions<TExternal, TInternal> {
  /** External → internal, e.g. add keys. Defaults to a deep clone. */
  toInternal?: (value: TExternal) => TInternal;
  /** Internal → external, e.g. strip the added keys. Defaults to a deep clone. */
  toExternal?: (value: TInternal) => TExternal;
  /** Debounce outbound emits (ms). Number (incl. 0) defers; null/undefined emits synchronously. */
  debounce?: number | null;
  /** Called after an external (non-echo) value is synced inbound, i.e. a genuine parent reassignment. */
  onInbound?: () => void;
}

/**
 * Keeps an internal working copy in sync with a `defineModel` ref, applying
 * `toInternal` inbound and `toExternal` outbound. Mutating or reassigning the internal
 * ref propagates; our own emit is suppressed on the way back in.
 *
 * The inbound watch is not deep: an in-place mutation of the external model is
 * not detected. Parent changes must be reassignments (the idiomatic Vue pattern).
 */
export function useInternalModel<TExternal, TInternal = TExternal>(
  model: Ref<TExternal>,
  options: InternalModelOptions<TExternal, TInternal> = {},
): Ref<TInternal> {
  const toInternal = options?.toInternal ?? ((value) => clone(value) as unknown as TInternal);
  const toExternal = options?.toExternal ?? ((value) => clone(value) as unknown as TExternal);
  const debounceMs = options?.debounce;
  const shouldDebounce = typeof debounceMs === 'number';

  const EMPTY = Symbol();
  const internal = ref<TInternal>(null!) as Ref<TInternal>;
  let lastEmitted: TExternal | typeof EMPTY = EMPTY;
  let lastNormalized: TInternal | typeof EMPTY = EMPTY;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function emit() {
    timer = null;
    const emitted = toExternal(toRaw(internal.value) as TInternal);
    lastEmitted = emitted;
    model.value = emitted;
  }

  watch(
    model,
    (value) => {
      const isEcho = toRaw(value) === lastEmitted;
      lastEmitted = EMPTY;
      if (isEcho) return;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastNormalized = toInternal(toRaw(value) as TExternal);
      internal.value = lastNormalized;
      options.onInbound?.();
    },
    { immediate: true },
  );

  watch(
    internal,
    (newVal, oldVal) => {
      const raw = toRaw(newVal);
      // Skip the reassignment driven by our inbound watch; guarded on identity
      // change so in-place mutations of that same value still emit.
      const isInboundEcho = raw !== toRaw(oldVal) && raw === lastNormalized;
      lastNormalized = EMPTY;
      if (isInboundEcho) return;
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
    // Pending debounced emit is dropped, not flushed: leaving before it commits cancels it.
    onScopeDispose(() => timer && clearTimeout(timer));
  }

  return internal;
}

function clone<T>(value: T): T {
  return structuredClone(toRaw(value));
}
