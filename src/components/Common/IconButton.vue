<script setup>
  import { computed, onMounted, onUpdated, ref, watch } from 'vue';
  import { classes } from '../../core/ClassManager';
import { icons } from '../../core/IconManager';
  import Utils from '../../core/Utils';
  import { translate } from '../../i18n/i18n';

  const emit = defineEmits(['click']);
  const props = defineProps({
    icon: {
      type: String,
      required: true
    },
    btnClass: {
      type: String,
      default: 'btn_primary'
    },
    type: {
      type: String,
      default: 'button'
    },
  });

  const iconClass = computed(() => icons[props.icon]);
</script>

<template>
  <button :class="classes[btnClass]" :type="type" @click="$emit('click')">
    <i v-if="iconClass" :class="iconClass"></i>
    <template v-else>{{ translate(icon) }}</template>
  </button>
</template>

<style scoped>

</style>