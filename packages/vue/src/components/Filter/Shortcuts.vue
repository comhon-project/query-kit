<script setup>
import { ref, watch, computed } from 'vue';
import { classes } from '../../core/ClassManager';
import { translate } from '../../i18n/i18n';

defineEmits([
  'goToNext',
  'goToPrevious',
  'addFilterToParentGroup',
  'goToParentGroup',
  'goToRootGroup',
  'goToCollection',
  'goToFilter',
]);
const props = defineProps({
  onGoToNext: {
    type: Function,
    default: undefined,
  },
  onGoToPrevious: {
    type: Function,
    default: undefined,
  },
  onAddFilterToParentGroup: {
    type: Function,
    default: undefined,
  },
  onGoToParentGroup: {
    type: Function,
    default: undefined,
  },
  onGoToRootGroup: {
    type: Function,
    default: undefined,
  },
  onGoToCollection: {
    type: Function,
    default: undefined,
  },
  onGoToFilter: {
    type: Function,
    default: undefined,
  },
});

const isUsingShortcuts = ref(false);
const firstShortcut = ref(null);
const actions = {
  goToNext: 'go_to_next_condition',
  goToPrevious: 'go_to_previous_condition',
  addFilterToParentGroup: 'add_filter_on_parent_group',
  goToParentGroup: 'go_to_parent_group',
  goToRootGroup: 'go_to_root_group',
  goToCollection: 'go_to_collection',
  goToFilter: 'go_to_filter',
};
const filteredActions = computed(() => {
  const list = [];
  for (const key in actions) {
    const propEventName = 'on' + key.charAt(0).toUpperCase() + key.slice(1);
    if (props[propEventName]) {
      list.push({
        action: key,
        translation: actions[key],
      });
    }
  }
  return list;
});

function startUsingShortcuts() {
  isUsingShortcuts.value = true;
}

function finishUsingShortcuts() {
  // we have to do a setTimeout because the next element to be focused is no focused yet
  setTimeout(() => {
    if (!document.activeElement.classList.contains('qkit-shortcut')) {
      isUsingShortcuts.value = false;
    }
  }, 0);
}

watch(isUsingShortcuts, () => (isUsingShortcuts.value ? firstShortcut.value.focus() : null), { flush: 'post' });
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
        @click="$emit(filteredActions[0].action)"
        @focusout="finishUsingShortcuts"
      >
        {{ translate(filteredActions[0].translation) }}
      </button>
      <button
        v-for="index in filteredActions.length - 1"
        :key="index"
        class="qkit-shortcut qkit-focus-only"
        :class="classes.btn"
        @click="$emit(filteredActions[index].action)"
        @focusout="finishUsingShortcuts"
      >
        {{ translate(filteredActions[index].translation) }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.qkit-focus-only {
  position: absolute;
  left: 0;
  top: 0;
  background-color: white;
  width: 0;
  height: 0;
  opacity: 0;
  overflow: hidden;
}

.qkit-focus-only:focus-visible {
  opacity: 1;
  width: auto;
  height: auto;
}
</style>
