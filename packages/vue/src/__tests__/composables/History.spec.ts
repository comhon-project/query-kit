import { describe, it, expect } from 'vitest';
import { useHistory } from '@components/Composable/History';
import type { GroupFilter } from '@core/types';

function makeGroup(filters: unknown[] = []): GroupFilter {
  return { type: 'group', operator: 'and', filters: filters as GroupFilter['filters'] };
}

describe('useHistory', () => {
  describe('commit', () => {
    it('records states in undo stack', () => {
      const { commit, canUndo } = useHistory();
      commit(makeGroup());
      expect(canUndo.value).toBe(false);

      commit(makeGroup([{ type: 'condition', property: 'a', operator: '=' }]));
      expect(canUndo.value).toBe(true);
    });

    it('clears redo stack on new snapshot', () => {
      const { commit, undo, canRedo } = useHistory();
      commit(makeGroup());
      commit(makeGroup([{ type: 'condition', property: 'a', operator: '=' }]));

      undo();
      expect(canRedo.value).toBe(true);

      commit(makeGroup([{ type: 'condition', property: 'b', operator: '=' }]));
      expect(canRedo.value).toBe(false);
    });

    it('deep clones state so mutations do not affect history', () => {
      const { commit, undo } = useHistory();
      const state1 = makeGroup();
      commit(state1);

      const state2 = makeGroup([{ type: 'condition', property: 'a', operator: '=' }]);
      commit(state2);

      state1.operator = 'or';
      state2.filters.push({ type: 'condition', property: 'b', operator: '=' } as any);

      const restored = undo()!;
      expect(restored.operator).toBe('and');
      expect(restored.filters).toHaveLength(0);
    });

    it('skips a push whose reference matches the one returned by undo', () => {
      const { commit, undo, canUndo, canRedo } = useHistory();
      commit(makeGroup());
      commit(makeGroup([{ type: 'condition', property: 'a', operator: '=' }]));

      const restored = undo()!;
      commit(restored);

      expect(canUndo.value).toBe(false);
      expect(canRedo.value).toBe(true);
    });

    it('only skips the exact restored reference, not unrelated pushes', () => {
      const { commit, undo, canUndo } = useHistory();
      commit(makeGroup());
      commit(makeGroup([{ type: 'condition', property: 'a', operator: '=' }]));

      undo();
      commit(makeGroup([{ type: 'condition', property: 'x', operator: '=' }]));
      expect(canUndo.value).toBe(true);
    });
  });

  describe('canUndo', () => {
    it('is false with 0 entries', () => {
      const { canUndo } = useHistory();
      expect(canUndo.value).toBe(false);
    });

    it('is false with 1 entry', () => {
      const { commit, canUndo } = useHistory();
      commit(makeGroup());
      expect(canUndo.value).toBe(false);
    });

    it('is true with 2+ entries', () => {
      const { commit, canUndo } = useHistory();
      commit(makeGroup());
      commit(makeGroup());
      expect(canUndo.value).toBe(true);
    });
  });

  describe('canRedo', () => {
    it('is false with no undone states', () => {
      const { canRedo } = useHistory();
      expect(canRedo.value).toBe(false);
    });

    it('is true after an undo', () => {
      const { commit, undo, canRedo } = useHistory();
      commit(makeGroup());
      commit(makeGroup());
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
      const { commit, undo } = useHistory();
      commit(makeGroup());
      expect(undo()).toBeNull();
    });

    it('returns the previous state', () => {
      const { commit, undo } = useHistory();
      const first = makeGroup();
      const second = makeGroup([{ type: 'condition', property: 'a', operator: '=' }]);

      commit(first);
      commit(second);

      expect(undo()).toEqual(first);
    });

    it('allows multiple undos', () => {
      const { commit, undo } = useHistory();
      const s1 = makeGroup();
      const s2 = makeGroup([{ type: 'condition', property: 'a', operator: '=' }]);
      const s3 = makeGroup([{ type: 'condition', property: 'b', operator: '<>' }]);

      commit(s1);
      commit(s2);
      commit(s3);

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
      const { commit, undo, redo } = useHistory();
      const s1 = makeGroup();
      const s2 = makeGroup([{ type: 'condition', property: 'a', operator: '=' }]);

      commit(s1);
      commit(s2);

      undo();
      expect(redo()).toEqual(s2);
    });
  });

  describe('clear', () => {
    it('clears both stacks', () => {
      const { commit, undo, clear, canUndo, canRedo } = useHistory();
      commit(makeGroup());
      commit(makeGroup());
      commit(makeGroup());
      undo();

      expect(canUndo.value).toBe(true);
      expect(canRedo.value).toBe(true);

      clear();
      expect(canUndo.value).toBe(false);
      expect(canRedo.value).toBe(false);
    });

    it('resets the tracked reference so a pending restored ref is not muted', () => {
      const { commit, undo, clear, canUndo } = useHistory();
      commit(makeGroup());
      commit(makeGroup());

      const restored = undo()!;
      clear();
      commit(restored);
      expect(canUndo.value).toBe(false);
      commit(makeGroup());
      expect(canUndo.value).toBe(true);
    });
  });

  describe('undo/redo cycle', () => {
    it('handles full undo-redo-undo cycle', () => {
      const { commit, undo, redo } = useHistory();
      const s1 = makeGroup();
      const s2 = makeGroup([{ type: 'condition', property: 'a', operator: '=' }]);
      const s3 = makeGroup([{ type: 'condition', property: 'b', operator: '<>' }]);

      commit(s1);
      commit(s2);
      commit(s3);

      expect(undo()).toEqual(s2);
      expect(undo()).toEqual(s1);
      expect(redo()).toEqual(s2);
      expect(redo()).toEqual(s3);
      expect(undo()).toEqual(s2);
    });
  });
});
