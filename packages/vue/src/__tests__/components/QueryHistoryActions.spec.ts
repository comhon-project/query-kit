import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
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
  wrapper = mount(QueryHistoryActions, {
    props: {
      modelValue,
      'onUpdate:modelValue': (v: GroupFilter) => wrapper.setProps({ modelValue: v }),
      allowUndo: true,
      allowRedo: true,
      allowReset: true,
      ...props,
    },
  });
  return wrapper;
}

function findButton(icon: string) {
  return wrapper.findAllComponents(IconButton).find((btn) => btn.props('icon') === icon);
}

describe('QueryHistoryActions', () => {
  describe('rendering', () => {
    it('renders undo/redo/reset buttons when corresponding flags are true', () => {
      mountBar();
      expect(findButton('undo')).toBeDefined();
      expect(findButton('redo')).toBeDefined();
      expect(findButton('reset')).toBeDefined();
    });

    it('hides undo button when allowUndo=false', () => {
      mountBar({ allowUndo: false });
      expect(findButton('undo')).toBeUndefined();
    });

    it('hides redo button when allowRedo=false', () => {
      mountBar({ allowRedo: false });
      expect(findButton('redo')).toBeUndefined();
    });

    it('hides reset button when allowReset=false', () => {
      mountBar({ allowReset: false });
      expect(findButton('reset')).toBeUndefined();
    });

    it('does not render a search/validate button (handled outside)', () => {
      mountBar();
      expect(findButton('search')).toBeUndefined();
    });
  });

  describe('history state', () => {
    it('disables undo and redo initially', () => {
      mountBar({}, makeGroup());
      expect(findButton('undo')!.props('disabled')).toBe(true);
      expect(findButton('redo')!.props('disabled')).toBe(true);
    });

    it('enables undo after a second commit', async () => {
      mountBar({}, makeGroup());
      await wrapper.setProps({
        modelValue: makeGroup([{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }]),
      });
      expect(findButton('undo')!.props('disabled')).toBe(false);
    });

    it('enables redo after an undo', async () => {
      mountBar({}, makeGroup());
      await wrapper.setProps({
        modelValue: makeGroup([{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }]),
      });
      await findButton('undo')!.trigger('click');
      expect(findButton('redo')!.props('disabled')).toBe(false);
    });
  });

  describe('undo / redo / reset behaviors', () => {
    let g0: GroupFilter;
    let g1: GroupFilter;
    let g2: GroupFilter;

    beforeEach(() => {
      g0 = makeGroup();
      g1 = makeGroup([{ type: 'condition', property: 'first_name', operator: '=', value: 'Alice' }]);
      g2 = makeGroup([{ type: 'condition', property: 'first_name', operator: '=', value: 'Bob' }]);
    });

    it('undo emits previous state via v-model', async () => {
      mountBar({}, g0);
      await wrapper.setProps({ modelValue: g1 });
      await findButton('undo')!.trigger('click');
      const emits = wrapper.emitted('update:modelValue')!;
      expect(emits.at(-1)![0]).toEqual(g0);
    });

    it('redo emits the undone state again', async () => {
      mountBar({}, g0);
      await wrapper.setProps({ modelValue: g1 });
      await findButton('undo')!.trigger('click');
      await findButton('redo')!.trigger('click');
      const emits = wrapper.emitted('update:modelValue')!;
      expect(emits.at(-1)![0]).toEqual(g1);
    });

    it('reset emits the anchor (initial captured state)', async () => {
      mountBar({}, g0);
      await wrapper.setProps({ modelValue: g1 });
      await wrapper.setProps({ modelValue: g2 });
      await findButton('reset')!.trigger('click');
      const emits = wrapper.emitted('update:modelValue')!;
      expect(emits.at(-1)![0]).toEqual(g0);
    });

    it('reset clones anchor so subsequent mutations of emitted value do not corrupt it', async () => {
      mountBar({}, g0);
      await wrapper.setProps({ modelValue: g1 });
      await findButton('reset')!.trigger('click');
      const firstResetValue = wrapper.emitted('update:modelValue')!.at(-1)![0] as GroupFilter;
      firstResetValue.filters.push({ type: 'condition', property: 'x', operator: '=', value: 'mutated' });

      await wrapper.setProps({ modelValue: g2 });
      await findButton('reset')!.trigger('click');
      const secondResetValue = wrapper.emitted('update:modelValue')!.at(-1)![0] as GroupFilter;
      expect(secondResetValue.filters).toEqual([]);
    });
  });
});
