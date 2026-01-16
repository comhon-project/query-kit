<script setup lang="ts">
import { ref, watch, computed, useTemplateRef } from 'vue';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';

type ActionKey = 'goToNext' | 'goToPrevious' | 'addFilterToParentGroup' | 'goToParentGroup' | 'goToRootGroup' | 'goToCollection' | 'goToFilter';

interface Props {
  onGoToNext?: () => void;
  onGoToPrevious?: () => void;
  onAddFilterToParentGroup?: () => void;
  onGoToParentGroup?: () => void;
  onGoToRootGroup?: () => void;
  onGoToCollection?: () => void;
  onGoToFilter?: () => void;
}

type EmitFn = {
  (e: 'goToNext'): void;
  (e: 'goToPrevious'): void;
  (e: 'addFilterToParentGroup'): void;
  (e: 'goToParentGroup'): void;
  (e: 'goToRootGroup'): void;
  (e: 'goToCollection'): void;
  (e: 'goToFilter'): void;
};

const emit = defineEmits<EmitFn>();

function emitAction(action: ActionKey): void {
  (emit as (e: ActionKey) => void)(action);
}
const props = defineProps<Props>();

const isUsingShortcuts = ref<boolean>(false);
const firstShortcut = useTemplateRef<HTMLButtonElement>('firstShortcut');

const actions: Record<ActionKey, string> = {
  goToNext: 'go_to_next_condition',
  goToPrevious: 'go_to_previous_condition',
  addFilterToParentGroup: 'add_filter_on_parent_group',
  goToParentGroup: 'go_to_parent_group',
  goToRootGroup: 'go_to_root_group',
  goToCollection: 'go_to_collection',
  goToFilter: 'go_to_filter',
};

interface FilteredAction {
  action: ActionKey;
  translation: string;
}

const filteredActions = computed<FilteredAction[]>(() => {
  const list: FilteredAction[] = [];
  for (const key in actions) {
    const actionKey = key as ActionKey;
    const propEventName = ('on' + key.charAt(0).toUpperCase() + key.slice(1)) as keyof Props;
    if (props[propEventName]) {
      list.push({
        action: actionKey,
        translation: actions[actionKey],
      });
    }
  }
  return list;
});

function startUsingShortcuts(): void {
  isUsingShortcuts.value = true;
}

function finishUsingShortcuts(): void {
  // we have to do a setTimeout because the next element to be focused is no focused yet
  setTimeout(() => {
    if (!document.activeElement?.classList.contains('qkit-shortcut')) {
      isUsingShortcuts.value = false;
    }
  }, 0);
}

watch(isUsingShortcuts, () => (isUsingShortcuts.value ? firstShortcut.value?.focus() : null), { flush: 'post' });
</script>

<template>
  <div v-if="filteredActions.length" style="position: absolute; z-index: 10; left: 0; top: 0">
    <!-- follownig div is a workaround for screen reader, actually orca doesn't read next button without it (tabindex is important) -->
    <div tabindex="-1" />
    <button class="qkit-focus-only" :class="classes.btn" @click="startUsingShortcuts">
      {{ translate('show_action_shortcuts') }}
    </button>
    <template v-if="isUsingShortcuts">
      <button
        ref="firstShortcut"
        class="qkit-shortcut qkit-focus-only"
        :class="classes.btn"
        @click="emitAction(filteredActions[0].action)"
        @focusout="finishUsingShortcuts"
      >
        {{ translate(filteredActions[0].translation) }}
      </button>
      <button
        v-for="index in filteredActions.length - 1"
        :key="index"
        class="qkit-shortcut qkit-focus-only"
        :class="classes.btn"
        @click="emitAction(filteredActions[index].action)"
        @focusout="finishUsingShortcuts"
      >
        {{ translate(filteredActions[index].translation) }}
      </button>
    </template>
  </div>
</template>
