import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import QueryActionsBar from '@components/Common/QueryActionsBar.vue';
import QueryHistoryActions from '@components/Common/QueryHistoryActions.vue';
import IconButton from '@components/Common/IconButton.vue';
import type { VueWrapper } from '@vue/test-utils';
import type { GroupFilter } from '@core/types';

let wrapper: VueWrapper;

afterEach(() => {
  wrapper?.unmount();
});

function makeGroup(filters: GroupFilter['filters'] = []): GroupFilter {
  return { type: 'group', operator: 'and', filters };
}

function mountBar(props: Record<string, unknown> = {}, modelValue: GroupFilter = makeGroup()) {
  wrapper = mount(QueryActionsBar, {
    props: {
      modelValue,
      'onUpdate:modelValue': (v: GroupFilter) => wrapper.setProps({ modelValue: v }),
      allowUndo: true,
      allowRedo: true,
      allowReset: true,
      manual: false,
      ...props,
    },
  });
  return wrapper;
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

    it('forwards allow flags to QueryHistoryActions', () => {
      mountBar({ allowUndo: false, allowRedo: true, allowReset: false });
      const child = wrapper.findComponent(QueryHistoryActions);
      expect(child.props('allowUndo')).toBe(false);
      expect(child.props('allowRedo')).toBe(true);
      expect(child.props('allowReset')).toBe(false);
    });

    it('forwards modelValue down via v-model', () => {
      const group = makeGroup([{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }]);
      mountBar({}, group);
      const child = wrapper.findComponent(QueryHistoryActions);
      expect(child.props('modelValue')).toEqual(group);
    });

    it('propagates update:modelValue from QueryHistoryActions to its own emit', async () => {
      mountBar();
      const child = wrapper.findComponent(QueryHistoryActions);
      const newVal = makeGroup();
      child.vm.$emit('update:modelValue', newVal);
      await wrapper.vm.$nextTick();
      const emits = wrapper.emitted('update:modelValue');
      expect(emits).toBeDefined();
      expect(emits!.at(-1)![0]).toEqual(newVal);
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

    it('does not emit "validate" when other history buttons are clicked', async () => {
      mountBar({ manual: true }, makeGroup());
      await wrapper.setProps({
        modelValue: makeGroup([{ type: 'condition', property: 'x', operator: '=', value: 'a' }]),
      });
      await findButton('undo')!.trigger('click');
      expect(wrapper.emitted('validate')).toBeUndefined();
    });
  });
});
