<script setup>
import { computed, watchEffect, ref } from 'vue';
import { classes } from '../../core/ClassManager';
import { translate } from '../../i18n/i18n';
import Icon from '../Common/Icon.vue';

const emit = defineEmits(['update']);
const props = defineProps({
  page: {
    type: Number,
    required: true,
  },
  lock: {
    type: Boolean,
  },
  count: {
    type: Number,
    required: true,
  },
});
let timeoutId = null;
const currentPage = ref(null);
const nearPages = computed(() => {
  const indexes = [];
  for (let index = currentPage.value - 2; index <= currentPage.value + 2; index++) {
    if (index > 1 && index < props.count) {
      indexes.push(index);
    }
  }
  return indexes;
});

function updatePage(newPage, event) {
  event.preventDefault();
  if (!props.lock && newPage >= 1 && newPage <= props.count) {
    currentPage.value = newPage;
    clearTimeout(timeoutId);
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
      <li @click="(e) => updatePage(currentPage - 1, e)">
        <a href="#" :aria-label="translate('previous')">
          <Icon icon="previous" />
        </a>
      </li>
      <li :active="1 == currentPage ? '' : undefined" @click="(e) => updatePage(1, e)">
        <a href="#">1</a>
      </li>
      <li v-if="currentPage > 4">...</li>
      <li
        v-for="index in nearPages"
        :key="index"
        :active="index == currentPage ? '' : undefined"
        @click="(e) => updatePage(index, e)"
      >
        <a href="#">{{ index }}</a>
      </li>
      <li v-if="currentPage < count - 3">...</li>
      <li
        v-if="count && count != 1"
        :active="count == currentPage ? '' : undefined"
        @click="(e) => updatePage(count, e)"
      >
        <a href="#">{{ count }}</a>
      </li>
      <li @click="(e) => updatePage(currentPage + 1, e)">
        <a href="#" :aria-label="translate('next')">
          <Icon icon="next" />
        </a>
      </li>
    </ul>
  </nav>
</template>
