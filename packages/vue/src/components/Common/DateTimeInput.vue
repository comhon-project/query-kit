<script setup lang="ts">
import { computed } from 'vue';
import { DateTime } from 'luxon';
import { classes } from '@core/ClassManager';

interface Props {
  disabled?: boolean;
  userTimezone?: string;
  requestTimezone?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
});

const modelValue = defineModel<unknown>();

const inputValue = computed<string | null>({
  get: () => {
    if (modelValue.value == null) return null;
    const date = DateTime.fromISO(modelValue.value as string, { zone: props.requestTimezone }).setZone(
      props.userTimezone,
    );
    return `${date.toFormat('yyyy-LL-dd')}T${date.toFormat('TT')}`;
  },
  set: (value) => {
    if (value == null || value.trim() === '') {
      modelValue.value = undefined;
      return;
    }
    modelValue.value = DateTime.fromISO(value, { zone: props.userTimezone }).setZone(props.requestTimezone).toISO();
  },
});
</script>

<template>
  <input v-model="inputValue" :class="classes.input" type="datetime-local" :disabled="disabled" step="60" />
</template>
