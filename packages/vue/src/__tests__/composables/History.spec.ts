import { describe, it, expect } from 'vitest';
import { ref, nextTick } from 'vue';
import { useHistory } from '@components/Composable/History';

describe('useHistory', () => {
  describe('commit', () => {
    it('starts with undo and redo disabled', () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      history.register('filter', filter);
      expect(history.canUndo.value).toBe(false);
      expect(history.canRedo.value).toBe(false);
    });

    it('does not record anything before the first edit (register only seeds the baseline)', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      history.register('filter', filter);
      await nextTick();
      expect(history.canUndo.value).toBe(false);
    });

    it('records an edit made by reassigning the ref', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      history.register('filter', filter);

      filter.value = { v: 'f1' };
      await nextTick();

      expect(history.canUndo.value).toBe(true);
      expect(history.canRedo.value).toBe(false);
    });

    it('records an edit made by mutating the ref in place (deep)', async () => {
      const history = useHistory();
      const filter = ref({ type: 'group', filters: [] as unknown[] });
      history.register('filter', filter);

      filter.value.filters.push({ id: 'a' });
      await nextTick();

      expect(history.canUndo.value).toBe(true);
    });
  });

  describe('undo', () => {
    it('does nothing when there is nothing to undo', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      history.register('filter', filter);

      history.undo();
      await nextTick();

      expect(filter.value).toEqual({ v: 'f0' });
      expect(history.canUndo.value).toBe(false);
      expect(history.canRedo.value).toBe(false);
    });

    it('restores the previous value and disables undo back at the baseline', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      history.register('filter', filter);

      filter.value = { v: 'f1' };
      await nextTick();

      history.undo();
      await nextTick();

      expect(filter.value).toEqual({ v: 'f0' });
      expect(history.canUndo.value).toBe(false);
      expect(history.canRedo.value).toBe(true);
    });

    it('does not record the echo of a restore as a new entry', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      history.register('filter', filter);

      filter.value = { v: 'f1' };
      await nextTick();

      history.undo();
      await nextTick(); // the write echoes through the watcher here

      expect(history.canUndo.value).toBe(false);
      expect(history.canRedo.value).toBe(true);
    });

    it('restores snapshots verbatim, preserving node keys', async () => {
      const history = useHistory();
      const filter = ref({ type: 'group', key: 'root', filters: [{ type: 'condition', key: 'k1' }] as unknown[] });
      history.register('filter', filter);

      filter.value.filters.push({ type: 'condition', key: 'k2' });
      await nextTick();

      history.undo();
      await nextTick();

      expect(filter.value).toEqual({ type: 'group', key: 'root', filters: [{ type: 'condition', key: 'k1' }] });
    });

    it('walks back through several edits', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      history.register('filter', filter);

      filter.value = { v: 'f1' };
      await nextTick();
      filter.value = { v: 'f2' };
      await nextTick();

      history.undo();
      await nextTick();
      expect(filter.value).toEqual({ v: 'f1' });

      history.undo();
      await nextTick();
      expect(filter.value).toEqual({ v: 'f0' });
      expect(history.canUndo.value).toBe(false);
    });
  });

  describe('redo', () => {
    it('does nothing when there is nothing to redo', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      history.register('filter', filter);

      history.redo();
      await nextTick();

      expect(filter.value).toEqual({ v: 'f0' });
      expect(history.canRedo.value).toBe(false);
    });

    it('re-applies the undone value', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      history.register('filter', filter);

      filter.value = { v: 'f1' };
      await nextTick();
      history.undo();
      await nextTick();
      expect(filter.value).toEqual({ v: 'f0' });

      history.redo();
      await nextTick();

      expect(filter.value).toEqual({ v: 'f1' });
      expect(history.canUndo.value).toBe(true);
      expect(history.canRedo.value).toBe(false);
    });

    it('clears the redo stack on a new edit', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      history.register('filter', filter);

      filter.value = { v: 'f1' };
      await nextTick();
      history.undo();
      await nextTick();
      expect(history.canRedo.value).toBe(true);

      filter.value = { v: 'f2' };
      await nextTick();

      expect(history.canRedo.value).toBe(false);
      expect(history.canUndo.value).toBe(true);
    });
  });

  describe('multi-slice', () => {
    it('reverts the most recent edit whatever slice produced it', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      const sort = ref({ v: 's0' });
      history.register('filter', filter);
      history.register('sort', sort);

      filter.value = { v: 'f1' };
      await nextTick();
      sort.value = { v: 's1' };
      await nextTick();

      history.undo();
      await nextTick();
      expect(sort.value).toEqual({ v: 's0' });
      expect(filter.value).toEqual({ v: 'f1' });

      history.undo();
      await nextTick();
      expect(filter.value).toEqual({ v: 'f0' });
      expect(sort.value).toEqual({ v: 's0' });
      expect(history.canUndo.value).toBe(false);
    });

    it('only records the slice that changed', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      const sort = ref({ v: 's0' });
      history.register('filter', filter);
      history.register('sort', sort);

      filter.value = { v: 'f1' };
      await nextTick();

      history.undo();
      await nextTick();
      expect(filter.value).toEqual({ v: 'f0' });
      expect(sort.value).toEqual({ v: 's0' });
    });
  });

  describe('reset', () => {
    it('restores every changed slice to its baseline', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      const sort = ref({ v: 's0' });
      history.register('filter', filter);
      history.register('sort', sort);

      filter.value = { v: 'f1' };
      await nextTick();
      sort.value = { v: 's1' };
      await nextTick();

      history.reset();
      await nextTick();

      expect(filter.value).toEqual({ v: 'f0' });
      expect(sort.value).toEqual({ v: 's0' });
    });

    it('records the reset as a single undoable step', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      const sort = ref({ v: 's0' });
      history.register('filter', filter);
      history.register('sort', sort);

      filter.value = { v: 'f1' };
      await nextTick();
      sort.value = { v: 's1' };
      await nextTick();

      history.reset();
      await nextTick();

      history.undo();
      await nextTick();

      expect(filter.value).toEqual({ v: 'f1' });
      expect(sort.value).toEqual({ v: 's1' });
    });

    it('is a no-op when already at the baseline', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      history.register('filter', filter);

      history.reset();
      await nextTick();

      expect(filter.value).toEqual({ v: 'f0' });
      expect(history.canUndo.value).toBe(false);
    });
  });

  describe('clear', () => {
    it('drops the history', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      history.register('filter', filter);

      filter.value = { v: 'f1' };
      await nextTick();
      history.undo();
      await nextTick();
      expect(history.canRedo.value).toBe(true);

      history.clear();

      expect(history.canUndo.value).toBe(false);
      expect(history.canRedo.value).toBe(false);
    });

    it('rebaselines: reset targets the value at the time of clear', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      history.register('filter', filter);

      filter.value = { v: 'f1' };
      await nextTick();

      history.clear();

      filter.value = { v: 'f2' };
      await nextTick();
      history.reset();
      await nextTick();

      expect(filter.value).toEqual({ v: 'f1' });
    });
  });

  describe('rebaseline', () => {
    it('re-baselines a slice without recording an undoable entry', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      history.register('filter', filter);

      filter.value = { v: 'loaded' };
      history.rebaseline('filter');
      await nextTick();

      expect(history.canUndo.value).toBe(false);
    });

    it('drops any existing undo/redo history (a load is a fresh start)', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      history.register('filter', filter);

      filter.value = { v: 'edited' };
      await nextTick();
      expect(history.canUndo.value).toBe(true);

      filter.value = { v: 'loaded' };
      history.rebaseline('filter');
      await nextTick();

      expect(history.canUndo.value).toBe(false);
    });

    it('re-baselines every slice to its current value, so reset returns to the full state at load time', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      const sort = ref({ v: 's0' });
      history.register('filter', filter);
      history.register('sort', sort);

      filter.value = { v: 'f1' };
      await nextTick();
      sort.value = { v: 's1' };
      await nextTick();

      // parent loads only the filter; sort keeps its edited value
      filter.value = { v: 'loaded' };
      history.rebaseline('filter');
      await nextTick();

      history.reset();
      await nextTick();
      expect(filter.value).toEqual({ v: 'loaded' });
      expect(sort.value).toEqual({ v: 's1' });
    });

    it('handles a multi-slice load (several rebaselines in a row) without recording entries', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      const sort = ref({ v: 's0' });
      history.register('filter', filter);
      history.register('sort', sort);

      filter.value = { v: 'fL' };
      history.rebaseline('filter');
      sort.value = { v: 'sL' };
      history.rebaseline('sort');
      await nextTick();

      expect(history.canUndo.value).toBe(false);
    });

    it('keeps edits after a re-baseline undoable back to the re-baselined value', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      history.register('filter', filter);

      filter.value = { v: 'loaded' };
      history.rebaseline('filter');
      await nextTick();

      filter.value = { v: 'edited' };
      await nextTick();
      expect(history.canUndo.value).toBe(true);

      history.undo();
      await nextTick();
      expect(filter.value).toEqual({ v: 'loaded' });
    });
  });

  describe('register / unregister', () => {
    it('ignores re-registration of an existing slice (first ref wins)', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      const other = ref({ v: 'x' });
      history.register('filter', filter);
      history.register('filter', other);

      other.value = { v: 'y' };
      await nextTick();
      expect(history.canUndo.value).toBe(false);

      filter.value = { v: 'f1' };
      await nextTick();
      expect(history.canUndo.value).toBe(true);

      history.undo();
      await nextTick();
      expect(filter.value).toEqual({ v: 'f0' });
    });

    it('stops tracking a slice after unregister', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      history.register('filter', filter);
      history.unregister('filter');

      filter.value = { v: 'f1' };
      await nextTick();

      expect(history.canUndo.value).toBe(false);
    });

    it('prunes stack entries that referenced the unregistered slice', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      history.register('filter', filter);

      filter.value = { v: 'f1' };
      await nextTick();
      history.undo();
      await nextTick();
      expect(history.canUndo.value).toBe(false);
      expect(history.canRedo.value).toBe(true);

      history.unregister('filter');

      expect(history.canUndo.value).toBe(false);
      expect(history.canRedo.value).toBe(false);
    });

    it('keeps entries of other slices when one slice is unregistered', async () => {
      const history = useHistory();
      const filter = ref({ v: 'f0' });
      const sort = ref({ v: 's0' });
      history.register('filter', filter);
      history.register('sort', sort);

      filter.value = { v: 'f1' };
      await nextTick();
      sort.value = { v: 's1' };
      await nextTick();

      history.unregister('filter');

      // only the 'sort' edit remains undoable; the 'filter' entry is gone
      expect(history.canUndo.value).toBe(true);

      history.undo();
      await nextTick();
      expect(sort.value).toEqual({ v: 's0' });
      expect(history.canUndo.value).toBe(false);
    });
  });
});
