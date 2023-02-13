<script setup>
import { computed } from 'vue';
import { icons, iconComponent, iconPropName } from '../../core/IconManager';
import { translate } from '../../i18n/i18n';

const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
});

const isIconObj = computed(() => typeof icons[props.icon] == 'object');
const bindings = computed(() => (isIconObj.value ? icons[props.icon] : { [iconPropName]: icons[props.icon] }));
const component = computed(() =>
  isIconObj.value && icons[props.icon].component ? icons[props.icon].component : iconComponent
);
</script>

<template>
  <component v-if="icons[icon]" :is="component" v-bind="bindings"></component>
  <template v-else>{{ translate(icon) }}</template>
</template>
