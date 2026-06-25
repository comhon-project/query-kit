import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import QueryHistoryActions from '@components/Common/QueryHistoryActions.vue';
import IconButton from '@components/Common/IconButton.vue';
import { useHistory } from '@components/Composable/History';
import { flushAll } from '@tests/helpers/flushAsync';
import type { VueWrapper } from '@vue/test-utils';

let wrapper: VueWrapper;

afterEach(() => {
  wrapper?.unmount();
});

function setup(props: Record<string, unknown> = {}) {
  const history = useHistory();
  const filter = ref<{ v: string }>({ v: 'f0' });
  history.register('filter', filter);
  wrapper = mount(QueryHistoryActions, {
    props: { history, allowUndo: true, allowRedo: true, allowReset: true, ...props },
  });
  return { history, filter };
}

function findButton(icon: string) {
  return wrapper.findAllComponents(IconButton).find((btn) => btn.props('icon') === icon);
}

describe('QueryHistoryActions', () => {
  describe('rendering', () => {
    it('renders undo/redo/reset buttons when corresponding flags are true', () => {
      setup();
      expect(findButton('undo')).toBeDefined();
      expect(findButton('redo')).toBeDefined();
      expect(findButton('reset')).toBeDefined();
    });

    it('hides undo button when allowUndo=false', () => {
      setup({ allowUndo: false });
      expect(findButton('undo')).toBeUndefined();
    });

    it('hides redo button when allowRedo=false', () => {
      setup({ allowRedo: false });
      expect(findButton('redo')).toBeUndefined();
    });

    it('hides reset button when allowReset=false', () => {
      setup({ allowReset: false });
      expect(findButton('reset')).toBeUndefined();
    });

    it('does not render a search/validate button (handled outside)', () => {
      setup();
      expect(findButton('search')).toBeUndefined();
    });
  });

  describe('history state', () => {
    it('disables undo and redo initially', () => {
      setup();
      expect(findButton('undo')!.props('disabled')).toBe(true);
      expect(findButton('redo')!.props('disabled')).toBe(true);
    });

    it('enables undo after an edit', async () => {
      const { filter } = setup();
      filter.value = { v: 'f1' };
      await flushAll();
      expect(findButton('undo')!.props('disabled')).toBe(false);
    });

    it('enables redo after an undo', async () => {
      const { filter } = setup();
      filter.value = { v: 'f1' };
      await flushAll();
      await findButton('undo')!.trigger('click');
      await flushAll();
      expect(findButton('redo')!.props('disabled')).toBe(false);
    });
  });

  describe('undo / redo / reset behaviors', () => {
    it('undo restores the previous value', async () => {
      const { filter } = setup();
      filter.value = { v: 'f1' };
      await flushAll();
      await findButton('undo')!.trigger('click');
      await flushAll();
      expect(filter.value).toEqual({ v: 'f0' });
    });

    it('redo re-applies the undone value', async () => {
      const { filter } = setup();
      filter.value = { v: 'f1' };
      await flushAll();
      await findButton('undo')!.trigger('click');
      await flushAll();
      await findButton('redo')!.trigger('click');
      await flushAll();
      expect(filter.value).toEqual({ v: 'f1' });
    });

    it('reset restores the baseline', async () => {
      const { filter } = setup();
      filter.value = { v: 'f1' };
      await flushAll();
      filter.value = { v: 'f2' };
      await flushAll();
      await findButton('reset')!.trigger('click');
      await flushAll();
      expect(filter.value).toEqual({ v: 'f0' });
    });
  });
});
