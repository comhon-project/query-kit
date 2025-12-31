<script setup>
import { computed } from 'vue';
import { icons, iconComponent, iconPropName } from '@core/IconManager';
import { translate } from '@i18n/i18n';

const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  label: {
    // only if we want to have a different label than icon when there is no defined icon
    type: String,
    default: undefined,
  },
});

const isIconObj = computed(() => typeof icons[props.icon] == 'object');
const bindings = computed(() => (isIconObj.value ? icons[props.icon] : { [iconPropName]: icons[props.icon] }));
const component = computed(() =>
  isIconObj.value && icons[props.icon].component ? icons[props.icon].component : iconComponent
);
</script>

<template>
  <component :is="component" v-if="icons[icon]" v-bind="bindings" />
  <template v-else>{{ translate(label || icon) }}</template>
</template>
