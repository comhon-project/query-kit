<script setup lang="ts">
import { nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';
import IconButton from '@components/Common/IconButton.vue';
import { classes } from '@core/ClassManager';
import { getUniqueId } from '@core/Utils';

interface Props {
  closeOnConfirm?: boolean;
  disableConfirm?: boolean;
}

interface Emits {
  confirm: [];
  closed: [];
}

const emit = defineEmits<Emits>();
const show = defineModel<boolean>('show', { required: true });

const props = withDefaults(defineProps<Props>(), {
  closeOnConfirm: false,
  disableConfirm: false,
});

const modal = useTemplateRef<HTMLDialogElement>('modal');
const closing = ref<boolean | null>(null);
const headerId = `modal-header-${getUniqueId()}`;
let previouslyFocusedElement: HTMLElement | null = null;

function confirm(): void {
  if (props.closeOnConfirm) {
    show.value = false;
  }
  emit('confirm');
}

function close(): void {
  closing.value = false;
  modal.value?.close();
  previouslyFocusedElement?.focus();
  previouslyFocusedElement = null;
  emit('closed');
}

onMounted(() => {
  if (!modal.value) return;
  modal.value.ontransitionend = (e: TransitionEvent) => {
    if (e.target !== modal.value) {
      return;
    }
    if (closing.value) {
      close();
    }
  };
});

watch(show, async (visible) => {
  if (visible) {
    previouslyFocusedElement = document.activeElement as HTMLElement | null;
    modal.value?.showModal();
  } else {
    closing.value = true;
    await nextTick();
    if (!modal.value?.getAnimations().length) {
      close();
    }
  }
});
</script>

<template>
  <dialog ref="modal" :class="classes.modal" :visible="show && !closing ? '' : undefined" :aria-labelledby="headerId" @cancel.prevent="show = false">
    <div :class="classes.modal_header">
      <div :id="headerId"><slot name="header" /></div>
      <IconButton icon="close" btn-class="btn" @click="() => (show = false)" />
    </div>
    <div :class="classes.modal_body"><slot name="body" /></div>
    <div :class="classes.modal_footer">
      <slot name="footer">
        <IconButton icon="confirm" :disabled="disableConfirm" @click="confirm" />
      </slot>
    </div>
  </dialog>
</template>
