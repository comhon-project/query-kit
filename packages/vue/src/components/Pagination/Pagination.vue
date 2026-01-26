<script setup lang="ts">
import { computed, watchEffect, ref } from 'vue';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import Icon from '@components/Common/Icon.vue';

interface Props {
  page: number;
  lock?: boolean;
  count: number;
}

interface Emits {
  update: [page: number];
}

const emit = defineEmits<Emits>();
const props = defineProps<Props>();

let timeoutId: ReturnType<typeof setTimeout> | null = null;
const currentPage = ref<number>(null!);

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
      emit('update', currentPage.value);
    }, 300);
  }
}

watchEffect(() => (currentPage.value = props.page));
</script>

<template>
  <nav :aria-label="translate('pagination')">
    <ul :class="classes.pagination">
      <li>
        <button type="button" :aria-label="translate('previous')" :disabled="lock || currentPage <= 1" @click="updatePage(currentPage - 1)">
          <Icon icon="previous" />
        </button>
      </li>
      <li :active="currentPage === 1 ? '' : undefined">
        <button type="button" :aria-current="currentPage === 1 ? 'page' : undefined" :aria-label="`${translate('page')} 1`" @click="updatePage(1)">1</button>
      </li>
      <li v-if="currentPage > 4">...</li>
      <li
        v-for="index in nearPages"
        :key="index"
        :active="index == currentPage ? '' : undefined"
      >
        <button type="button" :aria-current="index == currentPage ? 'page' : undefined" :aria-label="`${translate('page')} ${index}`" @click="updatePage(index)">{{ index }}</button>
      </li>
      <li v-if="currentPage < count - 3">...</li>
      <li
        v-if="count && count != 1"
        :active="count == currentPage ? '' : undefined"
      >
        <button type="button" :aria-current="count == currentPage ? 'page' : undefined" :aria-label="`${translate('page')} ${count}`" @click="updatePage(count)">{{ count }}</button>
      </li>
      <li>
        <button type="button" :aria-label="translate('next')" :disabled="lock || currentPage >= count" @click="updatePage(currentPage + 1)">
          <Icon icon="next" />
        </button>
      </li>
    </ul>
  </nav>
</template>
