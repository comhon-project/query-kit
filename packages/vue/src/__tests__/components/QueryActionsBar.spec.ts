import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import QueryActionsBar from '@components/Common/QueryActionsBar.vue';
import QueryHistoryActions from '@components/Common/QueryHistoryActions.vue';
import IconButton from '@components/Common/IconButton.vue';
import { useHistory } from '@components/Composable/History';
import type { VueWrapper } from '@vue/test-utils';

let wrapper: VueWrapper;

afterEach(() => {
  wrapper?.unmount();
});

function mountBar(props: Record<string, unknown> = {}) {
  const history = useHistory();
  history.register('filter', ref<{ v: string }>({ v: 'f0' }));
  wrapper = mount(QueryActionsBar, {
    props: { history, allowUndo: true, allowRedo: true, allowReset: true, manual: false, ...props },
  });
  return { history };
}

function findButton(icon: string) {
  return wrapper.findAllComponents(IconButton).find((btn) => btn.props('icon') === icon);
}

describe('QueryActionsBar', () => {
  describe('composition', () => {
    it('renders the QueryHistoryActions sub-component', () => {
      mountBar();
      expect(wrapper.findComponent(QueryHistoryActions).exists()).toBe(true);
    });

    it('forwards the history store to QueryHistoryActions', () => {
      const { history } = mountBar();
      expect(wrapper.findComponent(QueryHistoryActions).props('history')).toBe(history);
    });

    it('forwards allow flags to QueryHistoryActions', () => {
      mountBar({ allowUndo: false, allowRedo: true, allowReset: false });
      const child = wrapper.findComponent(QueryHistoryActions);
      expect(child.props('allowUndo')).toBe(false);
      expect(child.props('allowRedo')).toBe(true);
      expect(child.props('allowReset')).toBe(false);
    });
  });

  describe('validate button', () => {
    it('does not render the search button when manual=false', () => {
      mountBar({ manual: false });
      expect(findButton('search')).toBeUndefined();
    });

    it('renders the search button when manual=true', () => {
      mountBar({ manual: true });
      expect(findButton('search')).toBeDefined();
    });

    it('emits "validate" when the search button is clicked', async () => {
      mountBar({ manual: true });
      await findButton('search')!.trigger('click');
      expect(wrapper.emitted('validate')).toBeDefined();
      expect(wrapper.emitted('validate')!.length).toBe(1);
    });

    it('does not emit "validate" when a history button is clicked', async () => {
      const { history } = mountBar({ manual: true });
      history.register('filter', ref({ v: 'f0' }));
      await findButton('undo')!.trigger('click');
      expect(wrapper.emitted('validate')).toBeUndefined();
    });
  });
});
