<script setup>
import { computed, watchEffect, ref } from 'vue';
import { classes } from '../../core/ClassManager';
import { icons } from '../../core/IconManager';
import { translate } from '../../i18n/i18n';

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
          <i v-if="icons['previous']" :class="icons['previous']"></i>
          <template v-else>{{ translate('previous') }}</template>
        </a>
      </li>
      <li :class="1 == currentPage ? classes.active : ''" @click="(e) => updatePage(1, e)"><a href="#">1</a></li>
      <li v-if="currentPage > 4">...</li>
      <li
        v-for="index in nearPages"
        :key="index"
        :class="index == currentPage ? classes.active : ''"
        @click="(e) => updatePage(index, e)"
      >
        <a href="#">{{ index }}</a>
      </li>
      <li v-if="currentPage < count - 3">...</li>
      <li
        v-if="count && count != 1"
        :class="count == currentPage ? classes.active : ''"
        @click="(e) => updatePage(count, e)"
      >
        <a href="#">{{ count }}</a>
      </li>
      <li @click="(e) => updatePage(currentPage + 1, e)">
        <a href="#" :aria-label="translate('next')">
          <i v-if="icons['next']" :class="icons['next']"></i>
          <template v-else>{{ translate('next') }}</template>
        </a>
      </li>
    </ul>
  </nav>
</template>
