import { onMounted, onScopeDispose, watch, type ShallowRef } from 'vue';

// Safety expiration of the arrival-at-origin signal, never the primary mechanism:
// native smooth scrolls complete under ~900ms; past this the return was interrupted
// (user grabbed the scroll) and the current position is user-chosen, so recheck there.
const RETURN_SAFETY_TIMEOUT_MS = 1500;

export interface ReachedEndOptions {
  /** End-of-content sentinel. Must be a stable element, present from mount on. */
  sentinel: Readonly<ShallowRef<Element | null>>;
  /** The component's own scroll container. Null/undefined reads as "at origin". */
  container: () => Element | null | undefined;
  /** Scroll offset of the container along the component's own axis. */
  scrollOffset: (container: Element) => number;
  /** Smooth-scroll the container back to its origin along the component's own axis. */
  scrollToOrigin: (container: Element) => void;
  /**
   * Displayed content, watched by identity: a new wrapper must be assigned on every
   * update; `replaced` describes that same update (replaced vs appended rows).
   */
  content: () => { replaced: boolean } | undefined;
  /** The sentinel is visible at fresh geometry: load more content. */
  onReachedEnd: () => void;
}

/**
 * Emits an end-of-content signal from an IntersectionObserver sentinel, reliably:
 *
 * - The observer only reports intersection *changes*; a page too short to fill the
 *   viewport keeps the sentinel visible with no transition. Every content update at
 *   origin forces a fresh initial report (unobserve/observe) so loading chains.
 * - A replacement while the container is scrolled makes the browser clamp the scroll
 *   offset; the sentinel can genuinely enter the viewport before the return-to-origin
 *   has moved anything. Reports are suppressed during that known-stale window, which
 *   is bounded by a real signal — the offset reaching the origin — then ended by a
 *   forced recheck at fresh geometry. A time-based hold cannot do this: the same
 *   one-shot report carries both the phantom and the legitimate chain-load signal.
 * - `scrollend` is deliberately not the settle signal: the tail of a user inertia
 *   scroll ending right after arming would settle prematurely at the stale position.
 * - When the container is not scrolled (or a theme scrolls the page instead — the
 *   container offset then always reads 0), no return happens and nothing is stale:
 *   reports flow through untouched.
 */
export function useReachedEnd(options: ReachedEndOptions): void {
  let observer: IntersectionObserver | undefined;
  let observed: Element | undefined;
  let returning = false;
  let returnContainer: Element | undefined;
  let safetyTimer: ReturnType<typeof setTimeout> | undefined;

  function atOrigin(): boolean {
    const container = options.container();
    // < 1: offsets can stay fractional under zoom/DPI scaling.
    return !container || options.scrollOffset(container) < 1;
  }

  function recheck(): void {
    if (!observer) return;
    if (observed) observer.unobserve(observed);
    observed = options.sentinel.value ?? undefined;
    if (observed) observer.observe(observed);
  }

  function onScroll(): void {
    if (atOrigin()) settle();
  }

  function cancelReturn(): void {
    returning = false;
    returnContainer?.removeEventListener('scroll', onScroll);
    returnContainer = undefined;
    if (safetyTimer) clearTimeout(safetyTimer);
    safetyTimer = undefined;
  }

  function settle(): void {
    cancelReturn();
    recheck();
  }

  // The container is captured for the whole return: the sentinel ref (hence
  // options.container()) is already null when disposal needs to detach the listener.
  function startReturn(container: Element): void {
    returning = true;
    returnContainer = container;
    container.addEventListener('scroll', onScroll, { passive: true });
    safetyTimer = setTimeout(settle, RETURN_SAFETY_TIMEOUT_MS);
    options.scrollToOrigin(container);
  }

  onMounted(() => {
    observer = new IntersectionObserver((entries) => {
      // Transitions coalesced into one delivery arrive oldest first; only the last
      // entry reflects the current state.
      if (entries[entries.length - 1].isIntersecting && !returning) {
        options.onReachedEnd();
      }
    });
    recheck();
  });

  // flush:'post' runs in the same flush as the DOM patch of the update it reacts to,
  // hence before the browser's layout clamp and its IntersectionObserver report.
  watch(options.content, (content) => {
    if (content?.replaced) {
      cancelReturn(); // a new replacement supersedes any in-flight return
      const container = options.container();
      if (container && options.scrollOffset(container) >= 1) {
        startReturn(container);
      } else {
        recheck();
      }
    } else if (!returning && atOrigin()) {
      // Appends while scrolled need nothing: the content overflows, natural transitions
      // take over. The at-origin guard also shields against not-yet-final heights of
      // entry animations, which only matter in a scrolled position.
      recheck();
    }
  }, { flush: 'post' });

  onScopeDispose(() => {
    observer?.disconnect();
    observer = undefined;
    cancelReturn();
  });
}
