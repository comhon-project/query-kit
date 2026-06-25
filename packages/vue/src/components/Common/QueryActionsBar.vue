<script setup lang="ts">
import { computed } from 'vue';
import { config as globalConfig } from '@config/config';
import QueryHistoryActions from '@components/Common/QueryHistoryActions.vue';
import IconButton from '@components/Common/IconButton.vue';
import type { History } from '@components/Composable/History';

interface Props {
  history: History;
  allowUndo?: boolean;
  allowRedo?: boolean;
  allowReset?: boolean;
  manual?: boolean;
}

// undefined: prevent Vue from casting absent boolean props to false
const props = withDefaults(defineProps<Props>(), {
  allowUndo: undefined,
  allowRedo: undefined,
  allowReset: undefined,
  manual: undefined,
});

defineEmits<{ validate: [] }>();

const manual = computed(() => props.manual ?? globalConfig.manual);
</script>

<template>
  <QueryHistoryActions
    :history="history"
    :allow-undo="allowUndo"
    :allow-redo="allowRedo"
    :allow-reset="allowReset"
  />
  <IconButton v-if="manual" icon="search" @click="$emit('validate')" />
</template>
