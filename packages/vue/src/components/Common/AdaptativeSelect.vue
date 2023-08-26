<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { translations } from '../../i18n/i18n';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true,
  },
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
});
const style = ref({});
const select = ref(null);
const selectedLabel = computed(() => {
  const option = props.options.find((opt) => opt.value == props.modelValue);
  return option ? option.label : '';
});

function updateWidth() {
  select.value.insertAdjacentHTML(
    'afterend',
    `<select :disabled="disabled">
      <option selected>${selectedLabel.value}</option>
    </select>`
  );
  style.value = { width: select.value.nextElementSibling.offsetWidth + 'px' };
  select.value.nextElementSibling.remove();
}

function updateValue(event) {
  emit('update:modelValue', event.target.value);
}

watch(translations, updateWidth, { flush: 'post' });
watch(() => props.modelValue, updateWidth, { flush: 'post' });
onMounted(updateWidth);
</script>

<template>
  <select
    ref="select"
    :value="modelValue"
    :style="style"
    :disabled="disabled"
    :aria-label="ariaLabel"
    @change="updateValue"
  >
    <option v-for="(option, index) in options" :key="index" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>
