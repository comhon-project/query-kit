import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { useWorkingValue } from '@components/Composable/WorkingValue';

const trim = (v: unknown) => (typeof v === 'string' ? v.trim() : v);

describe('useWorkingValue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns the source unchanged when no transform and no delay', () => {
    const source = ref('a');
    expect(useWorkingValue(source)).toBe(source);
  });

  it('debounces the write to source', async () => {
    const source = ref('a');
    const workingValue = useWorkingValue(source, { delay: 100 });

    workingValue.value = 'b';
    await nextTick();
    expect(source.value).toBe('a');

    vi.advanceTimersByTime(100);
    expect(source.value).toBe('b');
  });

  it('collapses a burst into a single write with the final value', async () => {
    const source = ref('a');
    const workingValue = useWorkingValue(source, { delay: 100 });

    workingValue.value = 'b';
    await nextTick();
    workingValue.value = 'c';
    await nextTick();

    vi.advanceTimersByTime(50);
    expect(source.value).toBe('a');
    vi.advanceTimersByTime(50);
    expect(source.value).toBe('c');
  });

  it('writes the transformed value but keeps the workingValue raw', async () => {
    const source = ref('');
    const workingValue = useWorkingValue(source, { delay: 100, transform: trim });

    workingValue.value = 'john ';
    await nextTick();
    vi.advanceTimersByTime(100);
    await nextTick();

    expect(source.value).toBe('john'); // trimmed on the way out
    expect(workingValue.value).toBe('john '); // workingValue stays raw
  });

  it('keeps a trailing space across debounce (slow typist can type a multi-word value)', async () => {
    const source = ref('');
    const workingValue = useWorkingValue(source, { delay: 100, transform: trim });

    workingValue.value = 'john';
    await nextTick();
    vi.advanceTimersByTime(100);
    await nextTick();
    expect(source.value).toBe('john');

    workingValue.value = 'john '; // user types a space, then pauses past the debounce
    await nextTick();
    vi.advanceTimersByTime(100);
    await nextTick();
    expect(workingValue.value).toBe('john '); // space NOT eaten
    expect(source.value).toBe('john'); // model unchanged (trim equals current)

    workingValue.value = 'john doe';
    await nextTick();
    vi.advanceTimersByTime(100);
    await nextTick();
    expect(source.value).toBe('john doe');
    expect(workingValue.value).toBe('john doe');
  });

  it('resyncs the workingValue on a genuine external change', async () => {
    const source = ref('a');
    const workingValue = useWorkingValue(source, { delay: 100, transform: trim });

    source.value = 'x';
    await nextTick();
    expect(workingValue.value).toBe('x');
  });

  it('re-typing a previously emitted value still propagates (no stale-token bug)', async () => {
    const source = ref('x');
    const workingValue = useWorkingValue(source, { delay: 100 });

    workingValue.value = 'y';
    await nextTick();
    vi.advanceTimersByTime(100);
    await nextTick(); // let the inbound watch settle, as it would before the next keystroke
    expect(source.value).toBe('y');

    workingValue.value = 'x';
    await nextTick();
    vi.advanceTimersByTime(100);
    expect(source.value).toBe('x');
  });
});
