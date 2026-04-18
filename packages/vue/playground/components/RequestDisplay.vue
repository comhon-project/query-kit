<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  request: Record<string, unknown> | null;
}>();

function highlight(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  const padInner = '  '.repeat(indent + 1);

  if (value === null || value === undefined) {
    return `<span class="json-null">null</span>`;
  }
  if (typeof value === 'string') {
    return `<span class="json-string">"${escapeHtml(value)}"</span>`;
  }
  if (typeof value === 'number') {
    return `<span class="json-number">${value}</span>`;
  }
  if (typeof value === 'boolean') {
    return `<span class="json-boolean">${value}</span>`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map((item) => `${padInner}${highlight(item, indent + 1)}`).join(',\n');
    return `[\n${items}\n${pad}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    const items = entries
      .map(([key, val]) => `${padInner}<span class="json-key">"${escapeHtml(key)}"</span>: ${highlight(val, indent + 1)}`)
      .join(',\n');
    return `{\n${items}\n${pad}}`;
  }
  return String(value);
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const highlighted = computed(() => (props.request ? highlight(props.request) : null));
</script>

<template>
  <details class="request-display" open>
    <summary>Request</summary>
    <pre v-if="highlighted" v-html="highlighted" />
    <p v-else>No request sent yet.</p>
  </details>
</template>

<style scoped>
.request-display {
  margin-top: 0.5rem;
  border: 1px solid var(--qkit-color-border);
  border-radius: var(--qkit-border-radius-sm);
  background: var(--qkit-input-background);
  color: var(--qkit-text-color);
}
.request-display summary {
  padding: var(--qkit-padding-md);
  cursor: pointer;
  font-weight: bold;
}
.request-display pre {
  padding: 0 var(--qkit-padding-lg) var(--qkit-padding-lg);
  margin: 0;
  overflow-x: auto;
  font-size: 0.85em;
  line-height: 1.5;
}
.request-display :deep(.json-key) {
  color: oklch(55% 0.15 250);
}
.request-display :deep(.json-string) {
  color: oklch(55% 0.15 145);
}
.request-display :deep(.json-number) {
  color: oklch(55% 0.15 45);
}
.request-display :deep(.json-boolean) {
  color: oklch(55% 0.15 310);
}
.request-display :deep(.json-null) {
  color: oklch(60% 0 0);
}
</style>
