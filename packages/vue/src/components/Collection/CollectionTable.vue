<script setup lang="ts">
import { computed, toRef, useTemplateRef } from 'vue';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import { useInternalModel } from '@components/Composable/InternalModel';
import { useReachedEnd } from '@components/Composable/ReachedEnd';
import { useColumnLabels } from '@components/Composable/ColumnLabels';
import Cell from '@components/Collection/Cell.vue';
import Header from '@components/Collection/Header.vue';
import type { EntitySchema } from '@core/EntitySchema';
import type { CollectionContent, CustomFieldConfig, SortItem } from '@core/types';

interface Props {
  content: CollectionContent;
  customFields?: Record<string, CustomFieldConfig>;
  entitySchema: EntitySchema;
  userTimezone: string;
  requestTimezone: string;
  reflow?: boolean;
  onRowClick?: (row: Record<string, unknown>, event: MouseEvent | KeyboardEvent) => void;
}

const sort = defineModel<(string | SortItem)[] | null>('sort');
const emit = defineEmits<{ reachedEnd: [] }>();
const props = defineProps<Props>();

const internalSort = useInternalModel(sort, { debounce: 300 });

const fieldsProperties = computed(() => props.content.fieldsProperties);
const displayedFields = computed<string[]>(() => Object.keys(fieldsProperties.value));
const columnLabels = useColumnLabels(toRef(props, 'entitySchema'), displayedFields, toRef(props, 'customFields'));

const observered = useTemplateRef<HTMLTableRowElement>('observered');

useReachedEnd({
  sentinel: observered,
  container: () => observered.value?.closest('table')?.parentElement,
  scrollOffset: (el) => el.scrollTop,
  scrollToOrigin: (el) => el.scrollTo({ top: 0, behavior: 'smooth' }),
  content: () => props.content,
  onReachedEnd: () => emit('reachedEnd'),
});

const orderByField = computed<Record<string, 'asc' | 'desc'>>(() => {
  const map: Record<string, 'asc' | 'desc'> = {};
  for (const value of internalSort.value ?? []) {
    const field = typeof value === 'string' ? value : value.field;
    // Mirror initSort's rules (Collection.vue): entries the request drops must not
    // show a sort arrow — fields not displayed, and open custom fields without a
    // custom sort config (no schema property → dropped from the server payload).
    if (!(field in fieldsProperties.value)) continue;
    if (!fieldsProperties.value[field] && !props.customFields?.[field]?.sort) continue;
    map[field] = typeof value === 'string' ? 'asc' : value.order || 'asc';
  }
  return map;
});

function nextOrder(current: 'asc' | 'desc' | undefined): 'asc' | 'desc' | undefined {
  if (!current) return 'asc';
  if (current === 'asc') return 'desc';
  return undefined;
}

function updateSort(fieldId: string | undefined, multi: boolean): void {
  if (!fieldId) {
    return;
  }
  const newOrder = nextOrder(orderByField.value[fieldId]);
  if (multi) {
    const updated: SortItem[] = Object.entries(orderByField.value).map(([field, order]) => ({ field, order }));
    const existingIndex = updated.findIndex((v) => v.field == fieldId);
    if (newOrder) {
      const newFieldSort: SortItem = { field: fieldId, order: newOrder };
      if (existingIndex != -1) {
        updated[existingIndex] = newFieldSort;
      } else {
        updated.push(newFieldSort);
      }
    } else if (existingIndex != -1) {
      updated.splice(existingIndex, 1);
    }
    internalSort.value = updated;
  } else {
    internalSort.value = newOrder ? [{ field: fieldId, order: newOrder }] : [];
  }
}

function rowKey(row: Record<string, unknown>, rowIndex: number): string | number {
  const uid = props.entitySchema.unique_identifier;
  return uid ? ((row[uid] as string | number | undefined) ?? rowIndex) : rowIndex;
}

const rowEvents = (row: Record<string, unknown>) =>
  props.onRowClick
    ? {
        click: (e: MouseEvent) => props.onRowClick!(row, e),
        keydown: (e: KeyboardEvent) => {
          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            props.onRowClick!(row, e);
          }
        },
      }
    : {};

</script>

<template>
  <table :class="classes.collection_table" :role="reflow ? 'table' : undefined">
    <caption :class="classes.sr_only">{{ translate('results') }}</caption>
    <thead :role="reflow ? 'rowgroup' : undefined">
      <tr :role="reflow ? 'row' : undefined">
        <Header
          v-for="fieldId in displayedFields"
          :key="fieldId"
          :entity-schema="entitySchema"
          :field-id="fieldId"
          :open="customFields?.[fieldId]?.open === true"
          :label="columnLabels[fieldId]"
          :order="orderByField[fieldId]"
          :has-custom-sort="customFields?.[fieldId]?.sort != null"
          :reflow="reflow"
          @click="updateSort"
        />
      </tr>
    </thead>
    <tbody :role="reflow ? 'rowgroup' : undefined">
      <tr
        v-for="(object, rowIndex) in content.collection"
        :key="rowKey(object, rowIndex)"
        :role="reflow ? 'row' : undefined"
        :class="onRowClick ? classes.collection_clickable_row : ''"
        :tabindex="onRowClick ? 0 : undefined"
        v-on="rowEvents(object)"
      >
        <template v-for="fieldId in displayedFields" :key="fieldId">
          <Cell
            :field-id="fieldId"
            :column-label="columnLabels[fieldId]"
            :property="fieldsProperties[fieldId]"
            :row-value="object"
            :renderer="customFields?.[fieldId]?.renderer"
            :user-timezone="userTimezone"
            :request-timezone="requestTimezone"
            :reflow="reflow"
            @click="customFields?.[fieldId]?.onFieldClick"
          />
        </template>
      </tr>
      <tr ref="observered" aria-hidden="true" style="opacity: 0">
        <td :colspan="displayedFields.length" style="height: 1px; padding: 0; border: none"></td>
      </tr>
    </tbody>
  </table>
</template>
