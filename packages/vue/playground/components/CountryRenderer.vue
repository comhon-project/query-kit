<script setup lang="ts">
import { locale } from '@query-kit/vue';
import { computed } from 'vue';
import type { FieldRendererProps } from '@query-kit/vue';

const props = defineProps<FieldRendererProps>();

const countries: Record<string, { flag: string; label: Record<string, string> }> = {
  1: { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', label: { en: 'England', fr: 'Angleterre' } },
  2: { flag: '🇫🇷', label: { en: 'France', fr: 'France' } },
  3: { flag: '🇩🇪', label: { en: 'Germany', fr: 'Allemagne' } },
};

const display = computed(() => {
  const country = countries[props.value as string];
  if (!country) return props.value;
  const label = country.label[locale.value] ?? country.label.en;
  return `${country.flag} ${label}`;
});
</script>

<template>{{ display }}</template>
