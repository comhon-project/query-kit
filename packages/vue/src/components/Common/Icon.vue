<script setup lang="ts">
import { computed } from 'vue';
import { icons, iconComponent, iconPropName } from '@core/IconManager';
import type { IconName } from '@core/IconManager';
import { translate } from '@i18n/i18n';

interface Props {
  icon: IconName;
  label?: string; // only if we want to have a different label than icon when there is no defined icon
}

const props = defineProps<Props>();

const iconConfig = computed(() => icons[props.icon]);
const isIconObj = computed<boolean>(() => typeof iconConfig.value == 'object');
const bindings = computed<Record<string, unknown>>(() =>
  isIconObj.value && iconConfig.value ? iconConfig.value : { [iconPropName]: iconConfig.value },
);
const component = computed(() =>
  isIconObj.value && iconConfig.value?.component ? iconConfig.value.component : iconComponent,
);
</script>

<template>
  <component :is="component" v-if="icons[icon]" v-bind="bindings" aria-hidden="true" />
  <template v-else>{{ translate(label || icon) }}</template>
</template>
