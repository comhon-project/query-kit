<script setup lang="ts">
import { ref, watch } from 'vue';
import IconButton from '@components/Common/IconButton.vue';
import Modal from '@components/Common/Modal.vue';
import SortList from '@components/Collection/SortList.vue';
import { translate } from '@i18n/i18n';
import { type EntitySchema } from '@core/EntitySchema';
import type { CustomFieldConfig, SortItemField } from '@core/types';

interface Props {
  entitySchema: EntitySchema;
  fields?: string[];
  reflowFallback?: boolean;
  customFields?: Record<string, CustomFieldConfig>;
}

const sort = defineModel<(string | SortItemField)[] | null>();
defineProps<Props>();

const showModal = ref<boolean>(false);
const draft = ref<(string | SortItemField)[]>([...(sort.value ?? [])]);

function open(): void {
  showModal.value = true;
}
function confirm(): void {
  sort.value = [...draft.value];
  showModal.value = false;
}
function resetDraft(): void {
  draft.value = [...(sort.value ?? [])];
}

watch(sort, () => {
  if (!showModal.value) resetDraft();
});
</script>

<template>
  <IconButton icon="sort" :btn-class="reflowFallback ? 'collection_sort_button' : undefined" @click="open" />
  <Modal v-model:show="showModal" @confirm="confirm" @closed="resetDraft">
    <template #header>
      <h1>{{ translate('sort') }}</h1>
    </template>
    <template #body>
      <SortList v-model="draft" :fields="fields" :entity-schema="entitySchema" :custom-fields="customFields" />
    </template>
  </Modal>
</template>
