<script setup lang="ts">
import { computed, watch, toRaw } from 'vue';
import { useHistory } from '@components/Composable/History';
import { config as globalConfig } from '@config/config';
import IconButton from '@components/Common/IconButton.vue';
import type { GroupFilter } from '@core/types';

interface Props {
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
const modelValue = defineModel<GroupFilter>({ required: true });

const allowUndo = computed(() => props.allowUndo ?? globalConfig.allowUndo);
const allowRedo = computed(() => props.allowRedo ?? globalConfig.allowRedo);
const allowReset = computed(() => props.allowReset ?? globalConfig.allowReset);

const { commit, undo, redo, canUndo, canRedo } = useHistory();
let anchor: GroupFilter | null = null;

watch(
  modelValue,
  (val) => {
    if (anchor === null) anchor = structuredClone(toRaw(val));
    commit(val);
  },
  { immediate: true, deep: true },
);

function onUndo(): void {
  const state = undo();
  if (state) modelValue.value = state;
}

function onRedo(): void {
  const state = redo();
  if (state) modelValue.value = state;
}

function onReset(): void {
  if (anchor) modelValue.value = structuredClone(anchor);
}
</script>

<template>
  <IconButton v-if="allowUndo" icon="undo" :disabled="!canUndo" @click="onUndo" />
  <IconButton v-if="allowRedo" icon="redo" :disabled="!canRedo" @click="onRedo" />
  <IconButton v-if="allowReset" icon="reset" @click="onReset" />
</template>
