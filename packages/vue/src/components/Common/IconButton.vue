<script setup lang="ts">
import { computed } from 'vue';
import { classes, type ClassName } from '@core/ClassManager';
import { icons, type IconName } from '@core/IconManager';
import { translate } from '@i18n/i18n';
import Icon from '@components/Common/Icon.vue';
import type { ButtonType } from '@core/types';

interface Props {
  icon: IconName;
  btnClass?: ClassName;
  type?: ButtonType;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

interface Emits {
  click: [];
}

defineEmits<Emits>();

const props = withDefaults(defineProps<Props>(), {
  btnClass: 'btn_primary',
  type: 'button',
});

const computedAriaLabel = computed<string>(() => {
  const translatedLabel = translate(props.label || props.icon)!;
  return props.ariaLabel ? translatedLabel + ' ' + props.ariaLabel : translatedLabel;
});
</script>

<template>
  <button
    :class="classes[btnClass]"
    :type="type"
    :title="icons[icon] ? computedAriaLabel : undefined"
    :aria-label="computedAriaLabel"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <Icon :icon="icon" :label="label" />
  </button>
</template>
