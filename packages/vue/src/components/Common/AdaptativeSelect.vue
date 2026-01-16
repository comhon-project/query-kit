<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { loadedTranslations, locale } from '@i18n/i18n';
import type { SelectOption } from '@core/types';

interface Props {
  options: SelectOption[];
  disabled?: boolean;
  ariaLabel?: string;
  class?: string;
}

const modelValue = defineModel<string | number>({ required: true });

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const style = ref<Record<string, string>>({});
const select = useTemplateRef<HTMLSelectElement>('select');

const selectedLabel = computed<string>(() => {
  const option = props.options.find((opt) => opt.value == modelValue.value);
  return option ? option.label : '';
});

function updateWidth(): void {
  if (!select.value) return;
  select.value.insertAdjacentHTML(
    'afterend',
    `<select :disabled="disabled" class="${props.class}">
      <option selected>${selectedLabel.value}</option>
    </select>`,
  );
  style.value = { width: (select.value.nextElementSibling as HTMLElement).offsetWidth + 'px' };
  select.value.nextElementSibling?.remove();
}

watch([locale, loadedTranslations], updateWidth, { flush: 'post', deep: true });
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
