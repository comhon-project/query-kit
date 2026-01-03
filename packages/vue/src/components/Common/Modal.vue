<script setup>
import { nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';
import IconButton from '@components/Common/IconButton.vue';
import { classes } from '@core/ClassManager';

const emit = defineEmits(['confirm', 'closed']);
const show = defineModel('show', { type: Boolean, required: true });
const props = defineProps({
  closeOnConfirm: {
    type: Boolean,
    default: false,
  },
  disableConfirm: {
    type: Boolean,
    default: false,
  },
});
const modal = useTemplateRef('modal');
const closing = ref(null);

function confirm() {
  if (props.closeOnConfirm) {
    show.value = false;
  }
  emit('confirm');
}

function close() {
  closing.value = false;
  modal.value.close();
  emit('closed');
}

onMounted(() => {
  modal.value.ontransitionend = (e) => {
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
    modal.value.showModal();
  } else {
    closing.value = true;
    await nextTick();
    if (!modal.value.getAnimations().length) {
      close();
    }
  }
});
</script>

<template>
  <dialog ref="modal" :class="classes.modal" :visible="show && !closing ? '' : undefined" @cancel.prevent="show = false">
    <div :class="classes.modal_header">
      <div><slot name="header" /></div>
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
