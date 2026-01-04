<script setup>
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { loadedTranslations } from '@i18n/i18n';

const modelValue = defineModel({ type: [String, Number], required: true });
const props = defineProps({
  options: {
    type: Array,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  ariaLabel: {
    type: String,
    default: undefined,
  },
  class: {
    type: String,
    default: undefined,
  },
});
const style = ref({});
const select = useTemplateRef('select');
const selectedLabel = computed(() => {
  const option = props.options.find((opt) => opt.value == modelValue.value);
  return option ? option.label : '';
});

function updateWidth() {
  select.value.insertAdjacentHTML(
    'afterend',
    `<select :disabled="disabled" class="${props.class}">
      <option selected>${selectedLabel.value}</option>
    </select>`
  );
  style.value = { width: select.value.nextElementSibling.offsetWidth + 'px' };
  select.value.nextElementSibling.remove();
}

watch(loadedTranslations, updateWidth, { flush: 'post' });
watch(modelValue, updateWidth, { flush: 'post' });
onMounted(updateWidth);
</script>

<template>
  <select
    ref="select"
    v-model="modelValue"
    :style="style"
    :class="props.class"
    :disabled="disabled"
    :aria-label="ariaLabel"
  >
    <option v-for="(option, index) in props.options" :key="index" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>
