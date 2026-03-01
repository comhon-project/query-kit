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
      expect(canUndo.value).toBe(false); // only 1 entry

      pushSnapshot(makeGroup([{ type: 'condition', property: 'a', operator: '=' }]));
      expect(canUndo.value).toBe(true); // 2 entries
    });

    it('clears redo stack on new snapshot', () => {
      const { pushSnapshot, undo, canRedo } = useHistory();
      pushSnapshot(makeGroup());
      pushSnapshot(makeGroup([{ type: 'condition', property: 'a', operator: '=' }]));

      undo();
      // skip the pushSnapshot triggered by undo flag
      pushSnapshot(makeGroup());
      expect(canRedo.value).toBe(true); // redo still has the undone state

      // now a real new snapshot should clear redo
      pushSnapshot(makeGroup([{ type: 'condition', property: 'b', operator: '=' }]));
      expect(canRedo.value).toBe(false);
    });

    it('deep clones state so mutations do not affect history', () => {
      const { pushSnapshot, undo } = useHistory();
      const state1 = makeGroup();
      pushSnapshot(state1);

      const state2 = makeGroup([{ type: 'condition', property: 'a', operator: '=' }]);
      pushSnapshot(state2);

      // mutate the original objects
      state1.operator = 'or';
      state2.filters.push({ type: 'condition', property: 'b', operator: '=' } as any);

      const restored = undo()!;
      expect(restored.operator).toBe('and');
      expect(restored.filters).toHaveLength(0);
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
      // skip flag consumes this push, redo stack still has the undone entry
      pushSnapshot(makeGroup());
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

      const restored = undo();
      expect(restored).toEqual(first);
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
      // skip flag
      pushSnapshot(makeGroup());
      expect(undo()).toEqual(s1);
    });

    it('sets isUndoRedoInProgress so next pushSnapshot is skipped', () => {
      const { pushSnapshot, undo, canUndo, canRedo } = useHistory();
      pushSnapshot(makeGroup());
      pushSnapshot(makeGroup([{ type: 'condition', property: 'a', operator: '=' }]));
      pushSnapshot(makeGroup([{ type: 'condition', property: 'b', operator: '<>' }]));

      undo();
      // This push should be skipped (flag is set)
      pushSnapshot(makeGroup([{ type: 'condition', property: 'x', operator: '=' }]));
      // After the skip, undo stack should still have 2 entries, redo stack 1
      expect(canUndo.value).toBe(true);
      expect(canRedo.value).toBe(true);
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
      // skip flag
      pushSnapshot(makeGroup());

      const restored = redo();
      expect(restored).toEqual(s2);
    });

    it('sets isUndoRedoInProgress so next pushSnapshot is skipped', () => {
      const { pushSnapshot, undo, redo, canUndo } = useHistory();
      pushSnapshot(makeGroup());
      pushSnapshot(makeGroup([{ type: 'condition', property: 'a', operator: '=' }]));

      undo();
      // skip flag from undo
      pushSnapshot(makeGroup());

      redo();
      // skip flag from redo
      pushSnapshot(makeGroup([{ type: 'condition', property: 'x', operator: '=' }]));

      // undo stack should have 2 entries again (s1, s2)
      expect(canUndo.value).toBe(true);
    });
  });

  describe('clearHistory', () => {
    it('clears both stacks', () => {
      const { pushSnapshot, undo, clearHistory, canUndo, canRedo } = useHistory();
      pushSnapshot(makeGroup());
      pushSnapshot(makeGroup());
      pushSnapshot(makeGroup());
      // 3 entries in undo → canUndo=true
      undo();
      // skip flag
      pushSnapshot(makeGroup());
      // undo stack has 2, redo stack has 1

      expect(canUndo.value).toBe(true);
      expect(canRedo.value).toBe(true);

      clearHistory();
      expect(canUndo.value).toBe(false);
      expect(canRedo.value).toBe(false);
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

      // undo to s2
      expect(undo()).toEqual(s2);
      pushSnapshot(makeGroup()); // skip

      // undo to s1
      expect(undo()).toEqual(s1);
      pushSnapshot(makeGroup()); // skip

      // redo to s2
      expect(redo()).toEqual(s2);
      pushSnapshot(makeGroup()); // skip

      // redo to s3
      expect(redo()).toEqual(s3);
      pushSnapshot(makeGroup()); // skip

      // undo back to s2
      expect(undo()).toEqual(s2);
    });
  });
});
