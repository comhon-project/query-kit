<script setup lang="ts">
import { config } from '@config/config';
import type { FieldRendererProps } from '@core/types';

defineProps<FieldRendererProps>();
</script>

<template>
  <div v-if="config.renderHtml" v-html="value" />
  <template v-else>{{ value }}</template>
</template>
