<script setup>
import { computed } from 'vue';
import { classes } from '../../core/ClassManager';
import { translate } from '../../i18n/i18n';
import Icon from './Icon.vue';

defineEmits(['click']);
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
  label: {
    // only if we want to have a different label than icon
    type: String,
    default: undefined,
  },
  ariaLabel: {
    type: String,
    default: undefined,
  },
});

const computedAriaLabel = computed(() => {
  const label = props.label || props.icon;
  return props.ariaLabel ? translate(label) + ' ' + props.ariaLabel : translate(label);
});
</script>

<template>
  <button :class="classes[btnClass]" :type="type" :aria-label="computedAriaLabel" @click="$emit('click')">
    <Icon :icon="icon" :label="label" />
  </button>
</template>
