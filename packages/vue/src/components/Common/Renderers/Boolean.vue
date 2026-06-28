<script setup lang="ts">
import { translate } from '@i18n/i18n';
import type { FieldRendererProps } from '@core/types';

defineProps<FieldRendererProps>();
</script>

<template>
  {{ value != null ? translate(value ? 'yes' : 'no') : null }}
</template>
