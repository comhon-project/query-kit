<script setup lang="ts">
import { computed } from 'vue';
import { config as globalConfig } from '@config/config';
import IconButton from '@components/Common/IconButton.vue';
import type { History } from '@components/Composable/History';

interface Props {
  history: History;
  allowUndo?: boolean;
  allowRedo?: boolean;
  allowReset?: boolean;
}

// undefined: prevent Vue from casting absent boolean props to false
const props = withDefaults(defineProps<Props>(), {
  allowUndo: undefined,
  allowRedo: undefined,
  allowReset: undefined,
});

const allowUndo = computed(() => props.allowUndo ?? globalConfig.allowUndo);
const allowRedo = computed(() => props.allowRedo ?? globalConfig.allowRedo);
const allowReset = computed(() => props.allowReset ?? globalConfig.allowReset);

const canUndo = computed(() => props.history.canUndo.value);
const canRedo = computed(() => props.history.canRedo.value);
</script>

<template>
  <IconButton v-if="allowUndo" icon="undo" :disabled="!canUndo" @click="history.undo()" />
  <IconButton v-if="allowRedo" icon="redo" :disabled="!canRedo" @click="history.redo()" />
  <IconButton v-if="allowReset" icon="reset" @click="history.reset()" />
</template>
