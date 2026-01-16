<script setup lang="ts">
import { translate } from '@i18n/i18n';
import type { CellRendererProps } from '@core/types';

defineProps<CellRendererProps>();
</script>

<template>
  {{ value != null ? translate(value ? 'yes' : 'no') : null }}
</template>
