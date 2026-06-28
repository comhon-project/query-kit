<script setup lang="ts">
import { computed, ref } from 'vue';
import IconButton from '@components/Common/IconButton.vue';
import Modal from '@components/Common/Modal.vue';
import FieldsBuilder from '@components/Collection/FieldsBuilder.vue';
import { translate } from '@i18n/i18n';
import type { EntitySchema } from '@core/EntitySchema';
import type { CustomFieldConfig } from '@core/types';

interface Props {
  entitySchema: EntitySchema;
  customFields?: Record<string, CustomFieldConfig>;
}

const fields = defineModel<string[]>({ required: true });
defineProps<Props>();

const showModal = ref<boolean>(false);
const draft = ref<string[]>([...fields.value]);
const disableConfirm = computed<boolean>(() => draft.value.length === 0);

function open(): void {
  showModal.value = true;
}

function confirm(): void {
  fields.value = [...draft.value];
  showModal.value = false;
}

function resetDraft(): void {
  draft.value = [...fields.value];
}
</script>

<template>
  <IconButton icon="columns" @click="open" />
  <Modal v-model:show="showModal" :disable-confirm="disableConfirm" @confirm="confirm" @closed="resetDraft">
    <template #header>
      <h1>{{ translate('columns') }}</h1>
    </template>
    <template #body>
      <FieldsBuilder v-model="draft" :entity-schema="entitySchema" :custom-fields="customFields" />
    </template>
  </Modal>
</template>
