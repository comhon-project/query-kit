<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from 'vue';
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
const headerId = `modal-header-${getUniqueId()}`;
let previouslyFocusedElement: HTMLElement | null = null;

function confirm(): void {
  if (props.closeOnConfirm) {
    show.value = false;
  }
  emit('confirm');
}

function close(): void {
  modal.value?.close();
  previouslyFocusedElement?.focus();
  previouslyFocusedElement = null;
  emit('closed');
}

watch(show, async (visible) => {
  if (visible) {
    previouslyFocusedElement = document.activeElement as HTMLElement | null;
    if (!modal.value?.open) modal.value?.showModal();
    return;
  }
  await nextTick();
  await Promise.allSettled(modal.value?.getAnimations().map((a) => a.finished) ?? []);
  if (!show.value) close();
});
</script>

<template>
  <dialog
    ref="modal"
    :class="classes.modal"
    :visible="show ? '' : undefined"
    :aria-labelledby="headerId"
    @cancel.prevent="show = false"
  >
    <header :class="classes.modal_header">
      <div :id="headerId"><slot name="header" /></div>
      <IconButton icon="close" btn-class="btn" @click="() => (show = false)" />
    </header>
    <div :class="classes.modal_body"><slot name="body" /></div>
    <footer :class="classes.modal_footer">
      <slot name="footer">
        <IconButton icon="confirm" :disabled="disableConfirm" @click="confirm" />
      </slot>
    </footer>
  </dialog>
</template>
