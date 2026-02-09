<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import IconButton from '../Common/IconButton.vue';

interface Props {
  lock?: boolean;
  count: number;
}

const modelValue = defineModel<number>({ required: true });
const props = defineProps<Props>();

let timeoutId: ReturnType<typeof setTimeout> | null = null;
const currentPage = ref<number>(modelValue.value);

const nearPages = computed<number[]>(() => {
  const indexes: number[] = [];
  for (let index = currentPage.value - 2; index <= currentPage.value + 2; index++) {
    if (index > 1 && index < props.count) {
      indexes.push(index);
    }
  }
  return indexes;
});

function updatePage(newPage: number): void {
  if (!props.lock && newPage >= 1 && newPage <= props.count) {
    currentPage.value = newPage;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (props.lock) {
        currentPage.value = modelValue.value;
      } else {
        modelValue.value = currentPage.value;
      }
    }, 500);
  }
}

watchEffect(() => (currentPage.value = modelValue.value));
</script>

<template>
  <nav :aria-label="translate('pagination')">
    <ul :class="classes.pagination">
      <li>
        <IconButton icon="previous" :disabled="lock || currentPage <= 1" @click="updatePage(currentPage - 1)" />
      </li>
      <li :active="currentPage === 1 ? '' : undefined">
        <button
          type="button"
          :class="classes.btn_primary"
          :aria-current="currentPage === 1 ? 'page' : undefined"
          :aria-label="`${translate('page')} 1`"
          @click="updatePage(1)"
        >
          1
        </button>
      </li>
      <li v-if="currentPage > 4" :class="classes.btn_primary">...</li>
      <li v-for="index in nearPages" :key="index" :active="index == currentPage ? '' : undefined">
        <button
          type="button"
          :class="classes.btn_primary"
          :aria-current="index == currentPage ? 'page' : undefined"
          :aria-label="`${translate('page')} ${index}`"
          @click="updatePage(index)"
        >
          {{ index }}
        </button>
      </li>
      <li v-if="currentPage < count - 3" :class="classes.btn_primary">...</li>
      <li v-if="count && count != 1" :active="count == currentPage ? '' : undefined">
        <button
          type="button"
          :class="classes.btn_primary"
          :aria-current="count == currentPage ? 'page' : undefined"
          :aria-label="`${translate('page')} ${count}`"
          @click="updatePage(count)"
        >
          {{ count }}
        </button>
      </li>
      <li>
        <IconButton icon="next" :disabled="lock || currentPage >= count" @click="updatePage(currentPage + 1)" />
      </li>
    </ul>
  </nav>
</template>
