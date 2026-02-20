<script setup lang="ts">
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';

export type InvalidMessageKey =
  | 'invalid_column'
  | 'invalid_property'
  | 'invalid_scope'
  | 'invalid_operator'
  | 'invalid_entity'
  | 'invalid_type';

interface Props {
  messageKey: InvalidMessageKey;
  value: string;
}

defineProps<Props>();
</script>

<template>
  <span :class="classes.error_message" role="alert">
    {{ translate(messageKey) }} <span>{{ value }}</span>
  </span>
</template>
