<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { getEntityTranslation } from '@core/EntitySchema';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';

interface Props {
  options: string[];
}

const modelValue = defineModel<string[]>({ required: true });
const props = defineProps<Props>();

const localValue = ref<string[]>([...modelValue.value]);
const details = ref<HTMLDetailsElement>();

function onToggle(event: Event): void {
  if ((event.target as HTMLDetailsElement).open) {
    localValue.value = [...modelValue.value];
  }
}

function confirm(): void {
  modelValue.value = [...localValue.value];
  details.value?.removeAttribute('open');
}

function onClickOutside(event: MouseEvent): void {
  if (details.value && !details.value.contains(event.target as Node)) {
    details.value.removeAttribute('open');
  }
}

onMounted(() => document.addEventListener('click', onClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside));
</script>

<template>
  <details ref="details" :class="classes.entity_details" @toggle="onToggle">
    <summary>{{ translate('entities') }} ({{ modelValue.length }})</summary>
    <div>
      <select v-model="localValue" multiple :class="classes.input">
        <option v-for="id in props.options" :key="id" :value="id">
          {{ getEntityTranslation(id) }}
        </option>
      </select>
      <button type="button" :class="classes.btn_primary" @click="confirm">
        {{ translate('validate') }}
      </button>
    </div>
  </details>
</template>
