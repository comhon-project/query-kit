import { describe, it, expect } from 'vitest';
import { useHistory } from '@components/Filter/Composable/History';
import type { GroupFilter } from '@core/types';

function makeGroup(filters: unknown[] = []): GroupFilter {
  return { type: 'group', operator: 'and', filters: filters as GroupFilter['filters'] };
}

describe('useHistory', () => {
  describe('pushSnapshot', () => {
    it('records states in undo stack', () => {
      const { pushSnapshot, canUndo } = useHistory();
      pushSnapshot(makeGroup());
      expect(canUndo.value).toBe(false);

      pushSnapshot(makeGroup([{ type: 'condition', property: 'a', operator: '=' }]));
      expect(canUndo.value).toBe(true);
    });

    it('clears redo stack on new snapshot', () => {
      const { pushSnapshot, undo, canRedo } = useHistory();
      pushSnapshot(makeGroup());
      pushSnapshot(makeGroup([{ type: 'condition', property: 'a', operator: '=' }]));

      undo();
      expect(canRedo.value).toBe(true);

      pushSnapshot(makeGroup([{ type: 'condition', property: 'b', operator: '=' }]));
      expect(canRedo.value).toBe(false);
    });

    it('deep clones state so mutations do not affect history', () => {
      const { pushSnapshot, undo } = useHistory();
      const state1 = makeGroup();
      pushSnapshot(state1);

      const state2 = makeGroup([{ type: 'condition', property: 'a', operator: '=' }]);
      pushSnapshot(state2);

      state1.operator = 'or';
      state2.filters.push({ type: 'condition', property: 'b', operator: '=' } as any);

      const restored = undo()!;
      expect(restored.operator).toBe('and');
      expect(restored.filters).toHaveLength(0);
    });

    it('skips a push whose reference matches the one returned by undo', () => {
      const { pushSnapshot, undo, canUndo, canRedo } = useHistory();
      pushSnapshot(makeGroup());
      pushSnapshot(makeGroup([{ type: 'condition', property: 'a', operator: '=' }]));

      const restored = undo()!;
      pushSnapshot(restored);

      expect(canUndo.value).toBe(false);
      expect(canRedo.value).toBe(true);
    });

    it('only skips the exact restored reference, not unrelated pushes', () => {
      const { pushSnapshot, undo, canUndo } = useHistory();
      pushSnapshot(makeGroup());
      pushSnapshot(makeGroup([{ type: 'condition', property: 'a', operator: '=' }]));

      undo();
      pushSnapshot(makeGroup([{ type: 'condition', property: 'x', operator: '=' }]));
      expect(canUndo.value).toBe(true);
    });
  });

  describe('canUndo', () => {
    it('is false with 0 entries', () => {
      const { canUndo } = useHistory();
      expect(canUndo.value).toBe(false);
    });

    it('is false with 1 entry', () => {
      const { pushSnapshot, canUndo } = useHistory();
      pushSnapshot(makeGroup());
      expect(canUndo.value).toBe(false);
    });

    it('is true with 2+ entries', () => {
      const { pushSnapshot, canUndo } = useHistory();
      pushSnapshot(makeGroup());
      pushSnapshot(makeGroup());
      expect(canUndo.value).toBe(true);
    });
  });

  describe('canRedo', () => {
    it('is false with no undone states', () => {
      const { canRedo } = useHistory();
      expect(canRedo.value).toBe(false);
    });

    it('is true after an undo', () => {
      const { pushSnapshot, undo, canRedo } = useHistory();
      pushSnapshot(makeGroup());
      pushSnapshot(makeGroup());
      undo();
      expect(canRedo.value).toBe(true);
    });
  });

  describe('undo', () => {
    it('returns null when canUndo is false', () => {
      const { undo } = useHistory();
      expect(undo()).toBeNull();
    });

    it('returns null with only one snapshot', () => {
      const { pushSnapshot, undo } = useHistory();
      pushSnapshot(makeGroup());
      expect(undo()).toBeNull();
    });

    it('returns the previous state', () => {
      const { pushSnapshot, undo } = useHistory();
      const first = makeGroup();
      const second = makeGroup([{ type: 'condition', property: 'a', operator: '=' }]);

      pushSnapshot(first);
      pushSnapshot(second);

      expect(undo()).toEqual(first);
    });

    it('allows multiple undos', () => {
      const { pushSnapshot, undo } = useHistory();
      const s1 = makeGroup();
      const s2 = makeGroup([{ type: 'condition', property: 'a', operator: '=' }]);
      const s3 = makeGroup([{ type: 'condition', property: 'b', operator: '<>' }]);

      pushSnapshot(s1);
      pushSnapshot(s2);
      pushSnapshot(s3);

      expect(undo()).toEqual(s2);
      expect(undo()).toEqual(s1);
    });
  });

  describe('redo', () => {
    it('returns null when canRedo is false', () => {
      const { redo } = useHistory();
      expect(redo()).toBeNull();
    });

    it('restores the undone state', () => {
      const { pushSnapshot, undo, redo } = useHistory();
      const s1 = makeGroup();
      const s2 = makeGroup([{ type: 'condition', property: 'a', operator: '=' }]);

      pushSnapshot(s1);
      pushSnapshot(s2);

      undo();
      expect(redo()).toEqual(s2);
    });
  });

  describe('clearHistory', () => {
    it('clears both stacks', () => {
      const { pushSnapshot, undo, clearHistory, canUndo, canRedo } = useHistory();
      pushSnapshot(makeGroup());
      pushSnapshot(makeGroup());
      pushSnapshot(makeGroup());
      undo();

      expect(canUndo.value).toBe(true);
      expect(canRedo.value).toBe(true);

      clearHistory();
      expect(canUndo.value).toBe(false);
      expect(canRedo.value).toBe(false);
    });

    it('resets the tracked reference so a pending restored ref is not muted', () => {
      const { pushSnapshot, undo, clearHistory, canUndo } = useHistory();
      pushSnapshot(makeGroup());
      pushSnapshot(makeGroup());

      const restored = undo()!;
      clearHistory();
      pushSnapshot(restored);
      expect(canUndo.value).toBe(false);
      pushSnapshot(makeGroup());
      expect(canUndo.value).toBe(true);
    });
  });

  describe('undo/redo cycle', () => {
    it('handles full undo-redo-undo cycle', () => {
      const { pushSnapshot, undo, redo } = useHistory();
      const s1 = makeGroup();
      const s2 = makeGroup([{ type: 'condition', property: 'a', operator: '=' }]);
      const s3 = makeGroup([{ type: 'condition', property: 'b', operator: '<>' }]);

      pushSnapshot(s1);
      pushSnapshot(s2);
      pushSnapshot(s3);

      expect(undo()).toEqual(s2);
      expect(undo()).toEqual(s1);
      expect(redo()).toEqual(s2);
      expect(redo()).toEqual(s3);
      expect(undo()).toEqual(s2);
    });
  });
});
