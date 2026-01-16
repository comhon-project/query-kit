<script setup lang="ts">
import { computed } from 'vue';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import { icons } from '@core/IconManager';
import Icon from '@components/Common/Icon.vue';
import type { ButtonType, ButtonClass } from '@core/types';

interface Props {
  btnClass?: ButtonClass;
  type?: ButtonType;
  ariaLabel?: string;
}

const collapsed = defineModel<boolean>('collapsed', { required: true });

const props = withDefaults(defineProps<Props>(), {
  btnClass: 'btn_primary',
  type: 'button',
});

const stateTranslation = computed<string>(() => translate(collapsed.value ? 'expande' : 'collapse') ?? '');
const computedAriaLabel = computed<string>(() => {
  return props.ariaLabel ? stateTranslation.value + ' ' + props.ariaLabel : stateTranslation.value;
});
</script>

<template>
  <button :class="classes[btnClass]" :type="type" :aria-label="computedAriaLabel" @click="collapsed = !collapsed">
    <div v-if="icons['collapse']" class="qkit-collapse-icon-wrapper" :upsidedown="collapsed ? '' : undefined">
      <Icon icon="collapse" />
    </div>
    <template v-else>{{ stateTranslation }}</template>
  </button>
</template>
