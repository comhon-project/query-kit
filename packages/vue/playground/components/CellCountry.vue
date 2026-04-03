<script setup>
import { locale } from '@query-kit/vue';
import { computed } from 'vue';

const props = defineProps({
  columnId: { type: String, required: true },
  property: { type: Object, required: true },
  type: { type: Object, required: true },
  value: { type: null, required: true },
  rowValue: { type: Object, required: true },
  requestTimezone: { type: String, required: true },
  userTimezone: { type: String, required: true },
});

const countries = {
  1: { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', label: { en: 'England', fr: 'Angleterre' } },
  2: { flag: '🇫🇷', label: { en: 'France', fr: 'France' } },
  3: { flag: '🇩🇪', label: { en: 'Germany', fr: 'Allemagne' } },
};

const display = computed(() => {
  const country = countries[props.value];
  if (!country) return props.value;
  const label = country.label[locale.value] ?? country.label.en;
  return `${country.flag} ${label}`;
});
</script>

<template>{{ display }}</template>
