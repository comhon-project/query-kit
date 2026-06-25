import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, nextTick, toRaw } from 'vue';
import { useInternalModel } from '@components/Composable/InternalModel';

interface External {
  name: string;
  children: { name: string }[];
}

interface Internal {
  key: number;
  name: string;
  children: { key: number; name: string }[];
}

function makeExternal(name = 'root'): External {
  return { name, children: [{ name: 'a' }] };
}

describe('useInternalModel', () => {
  describe('without callbacks (deep clone)', () => {
    it('mirrors the model value into the internal ref', () => {
      const model = ref(makeExternal());
      const internal = useInternalModel(model);

      expect(internal.value).toEqual(model.value);
    });

    it('does not share references with the model', () => {
      const model = ref(makeExternal());
      const internal = useInternalModel(model);

      expect(internal.value).not.toBe(model.value);
      expect(internal.value.children).not.toBe(model.value.children);
    });
  });

  describe('nullable external model', () => {
    it('normalizes an initial null value instead of mistaking it for an empty echo', () => {
      const model = ref<External | null>(null);
      const internal = useInternalModel<External | null, Internal>(model, {
        normalize: (v) => ({ key: 1, name: v?.name ?? 'empty', children: [] }),
        strip: (v) => ({ name: v.name, children: [] }),
      });

      expect(internal.value).toEqual({ key: 1, name: 'empty', children: [] });
    });
  });

  describe('inbound (external → internal)', () => {
    it('re-normalizes when the model is reassigned from outside', async () => {
      const model = ref(makeExternal('root'));
      const internal = useInternalModel(model, {
        normalize: (v) => ({ key: 1, name: v.name, children: v.children.map((c) => ({ key: 2, ...c })) }),
        strip: (v) => ({ name: v.name, children: v.children.map(({ name }) => ({ name })) }),
      });

      model.value = makeExternal('changed');
      await nextTick();

      expect(internal.value.name).toBe('changed');
      expect(internal.value.key).toBe(1);
    });

    it('invokes onInbound on the initial sync and on each external reassignment', async () => {
      const model = ref(makeExternal('root'));
      let calls = 0;
      useInternalModel<External, Internal>(model, {
        normalize: (v) => ({ key: 1, name: v.name, children: [] }),
        strip: (v) => ({ name: v.name, children: [] }),
        onInbound: () => calls++,
      });
      expect(calls).toBe(1);

      model.value = makeExternal('loaded');
      await nextTick();
      expect(calls).toBe(2);
    });

    it('does not invoke onInbound when its own emit echoes back', async () => {
      const model = ref(makeExternal('root'));
      let calls = 0;
      const internal = useInternalModel<External, Internal>(model, {
        normalize: (v) => ({ key: 1, name: v.name, children: [] }),
        strip: (v) => ({ name: v.name, children: [] }),
        onInbound: () => calls++,
      });
      expect(calls).toBe(1);

      internal.value = { key: 9, name: 'edited', children: [] };
      await nextTick();
      expect(calls).toBe(1);
    });
  });

  describe('outbound (internal → external)', () => {
    it('strips the internal keys before emitting on a deep mutation', async () => {
      const model = ref(makeExternal());
      const internal = useInternalModel<External, Internal>(model, {
        normalize: (v) => ({ key: 1, name: v.name, children: v.children.map((c, i) => ({ key: i, ...c })) }),
        strip: (v) => ({ name: v.name, children: v.children.map(({ name }) => ({ name })) }),
      });

      internal.value.children[0].name = 'edited';
      await nextTick();

      expect(model.value).toEqual({ name: 'root', children: [{ name: 'edited' }] });
      expect(model.value).not.toHaveProperty('key');
    });

    it('emits when the internal ref is fully reassigned by the consumer', async () => {
      const model = ref(makeExternal());
      const internal = useInternalModel<External, Internal>(model, {
        normalize: (v) => ({ key: 1, name: v.name, children: [] }),
        strip: (v) => ({ name: v.name, children: [] }),
      });

      internal.value = { key: 9, name: 'replaced', children: [] };
      await nextTick();

      expect(model.value).toEqual({ name: 'replaced', children: [] });
    });

    it('does not write a parasite update back to the parent on an external set', async () => {
      const model = ref(makeExternal('root'));
      useInternalModel<External, Internal>(model, {
        normalize: (v) => ({ key: 1, name: v.name, children: [] }),
        strip: (v) => ({ name: v.name, children: [] }),
      });

      const parentRef = makeExternal('fromParent');
      model.value = parentRef;
      await nextTick();

      // The reference the parent set is untouched: no strip(normalize(...)) bounced back.
      // (model.value is a reactive proxy of parentRef, so compare the raw target.)
      expect(toRaw(model.value)).toBe(parentRef);
    });
  });

  describe('echo suppression', () => {
    it('does not re-normalize the internal copy after its own emit', async () => {
      const model = ref(makeExternal());
      let normalizeCalls = 0;
      const internal = useInternalModel<External, Internal>(model, {
        normalize: (v) => {
          normalizeCalls++;
          return { key: 1, name: v.name, children: v.children.map((c, i) => ({ key: i, ...c })) };
        },
        strip: (v) => ({ name: v.name, children: v.children.map(({ name }) => ({ name })) }),
      });

      const callsAfterMount = normalizeCalls;
      const internalRefBefore = internal.value;

      internal.value.name = 'edited';
      await nextTick();

      expect(normalizeCalls).toBe(callsAfterMount);
      expect(internal.value).toBe(internalRefBefore);
      expect(model.value.name).toBe('edited');
    });

    it('still normalizes a genuine external change after an emit', async () => {
      const model = ref(makeExternal());
      const internal = useInternalModel<External, Internal>(model, {
        normalize: (v) => ({ key: 1, name: v.name, children: [] }),
        strip: (v) => ({ name: v.name, children: [] }),
      });

      internal.value.name = 'edited';
      await nextTick();

      model.value = makeExternal('fromParent');
      await nextTick();

      expect(internal.value.name).toBe('fromParent');
      expect(internal.value.key).toBe(1);
    });
  });

  describe('debounce', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('collapses a burst of mutations into a single emit with the final value', async () => {
      const model = ref(makeExternal());
      const internal = useInternalModel<External, Internal>(model, {
        normalize: (v) => ({ key: 1, name: v.name, children: [] }),
        strip: (v) => ({ name: v.name, children: [] }),
        debounce: 50,
      });

      internal.value.name = 'a';
      await nextTick();
      internal.value.name = 'b';
      await nextTick();
      internal.value.name = 'c';
      await nextTick();

      // Still within the window: nothing emitted yet.
      expect(model.value.name).toBe('root');

      vi.advanceTimersByTime(50);

      expect(model.value).toEqual({ name: 'c', children: [] });
    });

    it('defers the emit even with delay 0 (not synchronous within the watch flush)', async () => {
      const model = ref(makeExternal());
      const internal = useInternalModel<External, Internal>(model, {
        normalize: (v) => ({ key: 1, name: v.name, children: [] }),
        strip: (v) => ({ name: v.name, children: [] }),
        debounce: 0,
      });

      internal.value.name = 'edited';
      await nextTick();

      expect(model.value.name).toBe('root');

      vi.runAllTimers();

      expect(model.value.name).toBe('edited');
    });

    it('cancels the pending emit when an external change arrives during the window', async () => {
      const model = ref(makeExternal('root'));
      const internal = useInternalModel<External, Internal>(model, {
        normalize: (v) => ({ key: 1, name: v.name, children: [] }),
        strip: (v) => ({ name: v.name, children: [] }),
        debounce: 50,
      });

      internal.value.name = 'localEdit';
      await nextTick();

      const parentRef = makeExternal('fromParent');
      model.value = parentRef;
      await nextTick();

      vi.advanceTimersByTime(50);

      // The external change won; the pending local emit was dropped.
      expect(internal.value.name).toBe('fromParent');
      expect(toRaw(model.value)).toBe(parentRef);
    });
  });
});
