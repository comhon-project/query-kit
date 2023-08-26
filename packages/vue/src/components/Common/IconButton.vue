<script setup>
import { computed } from 'vue';
import { classes } from '../../core/ClassManager';
import { translate } from '../../i18n/i18n';
import Icon from './Icon.vue';

const emit = defineEmits(['click']);
const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  btnClass: {
    type: String,
    default: 'btn_primary',
  },
  type: {
    type: String,
    default: 'button',
  },
  ariaLabel: {
    type: String,
    default: undefined,
  },
});

const computedAriaLabel = computed(() => {
  return props.ariaLabel ? translate(props.icon) + ' ' + props.ariaLabel : translate(props.icon);
});
</script>

<template>
  <button :class="classes[btnClass]" :type="type" :aria-label="computedAriaLabel" @click="$emit('click')">
    <Icon :icon="icon" />
  </button>
</template>
