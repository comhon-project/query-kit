<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import IconButton from '../Common/IconButton.vue';
import { classes } from '../../core/ClassManager';

const emit = defineEmits(['update:show', 'confirm', 'closed']);
const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  closeOnConfirm: {
    type: Boolean,
    default: false,
  },
});
const modal = ref(null);
const closing = ref(null);
const isVisible = computed({
  get() {
    return props.show;
  },
  set(value) {
    emit('update:show', value);
  },
});

function confirm() {
  if (props.closeOnConfirm) {
    isVisible.value = false;
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

watch(
  () => props.show,
  async (isVisible) => {
    if (isVisible) {
      modal.value.showModal();
    } else {
      closing.value = true;
      await nextTick();
      if (!modal.value.getAnimations().length) {
        close();
      }
    }
  }
);
</script>

<template>
  <dialog ref="modal" :class="classes.modal" :visible="isVisible && !closing ? '' : undefined">
    <div :class="classes.modal_header">
      <div><slot name="header" /></div>
      <IconButton icon="close" btn-class="btn" @click="() => (isVisible = false)" />
    </div>
    <div :class="classes.modal_body"><slot name="body" /></div>
    <div :class="classes.modal_footer">
      <slot name="footer">
        <IconButton icon="confirm" @click="confirm" />
      </slot>
    </div>
  </dialog>
</template>
