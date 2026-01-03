<script setup>
import { computed } from 'vue';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import { icons } from '@core/IconManager';
import Icon from '@components/Common/Icon.vue';

const collapsed = defineModel('collapsed', { type: Boolean, required: true });
const props = defineProps({
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

const stateTranslation = computed(() => translate(collapsed.value ? 'expande' : 'collapse'));
const computedAriaLabel = computed(() => {
  return props.ariaLabel ? stateTranslation.value + ' ' + props.ariaLabel : stateTranslation.value;
});
</script>

<template>
  <button
    :class="classes[btnClass]"
    :type="type"
    :aria-label="computedAriaLabel"
    @click="collapsed = !collapsed"
  >
    <div v-if="icons['collapse']" class="qkit-collapse-icon-wrapper" :upsidedown="collapsed ? '' : undefined">
      <Icon icon="collapse" />
    </div>
    <template v-else>{{ stateTranslation }}</template>
  </button>
</template>
