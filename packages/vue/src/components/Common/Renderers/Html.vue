<script setup lang="ts">
import { config } from '@config/config';
import type { CellRendererProps } from '@core/types';

defineProps<CellRendererProps>();
</script>

<template>
  <div v-if="config.renderHtml" v-html="value" />
  <template v-else>{{ value }}</template>
</template>
