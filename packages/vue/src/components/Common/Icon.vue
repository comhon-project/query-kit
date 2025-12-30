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

<style>
:root {
  --qkit-icon-size: 0.75rem;
}
.qkit-icon {
  background: currentColor;
  position: relative;
  display: block;
  width: var(--qkit-icon-size);
  height: var(--qkit-icon-size);
}
.qkit-icon-minus {
  clip-path: polygon(0% 35%, 100% 35%, 100% 65%, 0% 65%);
}
.qkit-icon-plus {
  clip-path: polygon(
    0% 35%,
    35% 35%,
    35% 0%,
    65% 0%,
    65% 35%,
    100% 35%,
    100% 65%,
    65% 65%,
    65% 100%,
    35% 100%,
    35% 65%,
    0% 65%
  );
}
.qkit-icon-cross {
  clip-path: polygon(
    20% 0%,
    0% 20%,
    30% 50%,
    0% 80%,
    20% 100%,
    50% 70%,
    80% 100%,
    100% 80%,
    70% 50%,
    100% 20%,
    80% 0%,
    50% 30%
  );
}
.qkit-icon-arrow-down {
  clip-path: polygon(25% 15%, 50% 50%, 75% 15%, 100% 15%, 50% 85%, 0 15%);
}
.qkit-icon-double-arrow-right {
  clip-path: polygon(45% 45%, 45% 0, 100% 50%, 45% 100%, 45% 55%, 0 100%, 0 0);
}
.qkit-icon-double-arrow-left {
  clip-path: polygon(55% 0, 55% 45%, 100% 0, 100% 100%, 55% 55%, 55% 100%, 0 50%);
}
.qkit-icon-arrow-full-down {
  clip-path: polygon(50% 80%, 0 20%, 100% 20%);
}

.qkit-icon-refresh {
  clip-path: polygon(
    33.36% 3.1%,
    54.99% 0.55%,
    76.98% 8.86%,
    92.36% 24.57%,
    98.54% 41.95%,
    97.49% 64.93%,
    87.26% 83%,
    69.69% 95.81%,
    46.97% 99.8%,
    25.4% 93.52%,
    13.67% 83.52%,
    4.16% 68.66%,
    24.25% 59.75%,
    28.56% 68.62%,
    37.25% 75.5%,
    48.53% 78.75%,
    60.46% 76.58%,
    70.5% 69.25%,
    76.5% 59.3%,
    77.65% 46.92%,
    74.25% 36.5%,
    65.75% 27.25%,
    53.75% 23%,
    40.31% 23.79%,
    30.47% 29.37%,
    45.33% 46.19%,
    0% 46.24%,
    0% 0%,
    16.51% 14.12%
  );
}
</style>
