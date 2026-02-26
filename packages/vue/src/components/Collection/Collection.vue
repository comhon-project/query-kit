<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, shallowRef, shallowReactive, computed, useTemplateRef } from 'vue';
import { requester as baseRequester } from '@core/Requester';
import { classes } from '@core/ClassManager';
import { resolve, getPropertyPath, type Property, type EntitySchema } from '@core/EntitySchema';
import { PropertyNotFoundError } from '@core/errors';
import { translate } from '@i18n/i18n';
import Icon from '@components/Common/Icon.vue';
import IconButton from '@components/Common/IconButton.vue';
import Pagination from '@components/Pagination/Pagination.vue';
import Cell from '@components/Collection/Cell.vue';
import Header from '@components/Collection/Header.vue';
import ColumnEditor from '@components/Collection/ColumnEditor.vue';
import InvalidColumn from '@components/Messages/InvalidColumn.vue';
import type {
  CustomColumnConfig,
  OrderByItem,
  CollectionType,
  Requester,
  RequesterFunction,
  Filter,
} from '@core/types';

interface Props {
  entity: string;
  customColumns?: Record<string, CustomColumnConfig>;
  filter?: Filter;
  directQuery?: boolean;
  limit: number;
  onRowClick?: (row: Record<string, unknown>, event: MouseEvent | KeyboardEvent) => void;
  quickSort?: boolean;
  postRequest?: (collection: Record<string, unknown>[]) => void | Promise<void>;
  allowedCollectionTypes?: CollectionType[];
  displayCount?: boolean;
  onExport?: (filter?: Filter) => void;
  userTimezone?: string;
  requestTimezone?: string;
  editColumns?: boolean;
  requester?: Requester | RequesterFunction;
  builderId?: string;
}

interface Emits {
  rowClick: [row: Record<string, unknown>, event: MouseEvent | KeyboardEvent];
}

interface IndexedOrderByEntry {
  order: 'asc' | 'desc';
  properties: string[];
}

const emit = defineEmits<Emits>();
const columns = defineModel<string[]>('columns', { required: true });
const orderBy = defineModel<(string | OrderByItem)[]>('orderBy');
const page = defineModel<number>('page', { default: 1 });
const props = withDefaults(defineProps<Props>(), {
  directQuery: true,
  quickSort: true,
  allowedCollectionTypes: () => ['pagination'],
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
});

let hasExecFirstQuery = false;
let requestId = 0;
let properties: string[] = [];
const requesting = ref<boolean>(false);
const columnsProperties = shallowRef<Record<string, Property | undefined>>({});
const collection = shallowReactive<Record<string, unknown>[]>([]);
const count = ref<number>(0);
const end = ref<boolean>(false);
const infiniteScroll = ref<boolean>(isInfiniteAccordingProps());
const collectionContent = useTemplateRef<HTMLDivElement>('collectionContent');
const entitySchema = ref<EntitySchema>();
const rowKeyProperty = ref<string>();
const indexedOrderBy = shallowRef<Record<string, IndexedOrderByEntry>>({});
const invalidColumns = ref<string[]>([]);

const observered = useTemplateRef<HTMLTableRowElement>('observered');
let observer: IntersectionObserver | undefined;

const activeRequester = computed<Requester | RequesterFunction>(() => {
  const requester = props.requester ?? baseRequester;
  if (!requester) {
    throw new Error('requester is required, either as a prop or registered globally via plugin options');
  }
  return requester;
});

const isResultFlattened = computed<boolean>(() => {
  return typeof activeRequester.value == 'object' ? !!activeRequester.value.flattened : false;
});

const computedColumns = computed<string[]>(() => Object.keys(columnsProperties.value));

const showInfiniteScrollObserver = computed(() => {
  return infiniteScroll.value && !end.value && !requesting.value && hasExecFirstQuery;
});

const pageCount = computed(() => Math.max(1, Math.ceil(count.value / props.limit)));

async function init(): Promise<void> {
  entitySchema.value = await resolve(props.entity);
  await initColumns(entitySchema.value);
  await initOrderBy(orderBy.value, computedColumns.value, entitySchema.value!.id, props.customColumns);
}

async function initColumns(entitySchema: EntitySchema): Promise<void> {
  const cols = columns.value;
  rowKeyProperty.value = entitySchema.unique_identifier;
  const colsProps: Record<string, Property | undefined> = {};
  properties = [];

  const invalid: string[] = [];
  for (const columnId of cols) {
    try {
      const propertyPath = props.customColumns?.[columnId]?.open
        ? undefined
        : await getPropertyPath(entitySchema.id, columnId);
      const property = propertyPath?.[propertyPath.length - 1];
      colsProps[columnId] = property;

      if (property) {
        if (property.type != 'relationship') {
          properties.push(columnId);
        } else if (property.relationship_type == 'belongs_to' || property.relationship_type == 'has_one') {
          const propertySchema = await resolve(property.related!);
          properties.push(columnId + '.' + (propertySchema.unique_identifier || 'id'));
          if (propertySchema.primary_identifiers) {
            for (const propertyId of propertySchema.primary_identifiers) {
              properties.push(columnId + '.' + propertyId);
            }
          }
        }
      }
    } catch (e) {
      if (e instanceof PropertyNotFoundError) {
        invalid.push(columnId);
      } else {
        throw e;
      }
    }
  }
  invalidColumns.value = invalid;
  columnsProperties.value = colsProps;
}

async function initOrderBy(
  orderBy: (string | OrderByItem)[] | undefined,
  columns: string[],
  entity: string,
  customColumns?: Record<string, CustomColumnConfig>,
): Promise<void> {
  if (!orderBy) {
    indexedOrderBy.value = {};
    return;
  }
  const indexed: Record<string, IndexedOrderByEntry> = {};
  for (const value of orderBy) {
    try {
      const column = typeof value == 'string' ? value : value.column;
      if (!columns.includes(column)) continue;
      const order = typeof value == 'string' ? ('asc' as const) : ((value.order || 'asc') as 'asc' | 'desc');

      let reqProps: string[];
      if (customColumns?.[column]?.order) {
        reqProps = customColumns[column].order!;
      } else {
        const propertyPath = await getPropertyPath(entity, column);
        const property = propertyPath[propertyPath.length - 1];

        if (property.type != 'relationship') {
          reqProps = [column];
        } else {
          const schema = await resolve(property.related!);
          if (schema.default_sort) {
            reqProps = schema.default_sort.map((prop) => column + '.' + prop);
          } else {
            const idProperty = schema.unique_identifier || 'id';
            reqProps = [column + '.' + idProperty];
          }
        }
      }
      indexed[column] = { order, properties: reqProps };
    } catch (e) {
      if (!(e instanceof PropertyNotFoundError)) throw e;
    }
  }
  indexedOrderBy.value = indexed;
}

function nextOrder(current: 'asc' | 'desc' | undefined): 'asc' | 'desc' | undefined {
  if (!current) return 'asc';
  if (current === 'asc') return 'desc';
  return undefined;
}

function updateOrder(columnId: string | undefined, multi: boolean): void {
  if (!columnId) {
    return;
  }
  const currentOrder = indexedOrderBy.value[columnId]?.order;
  const newOrder = nextOrder(currentOrder);
  if (multi) {
    const updated: OrderByItem[] = Object.entries(indexedOrderBy.value).map(([col, entry]) => ({
      column: col,
      order: entry.order,
    }));
    const existingIndex = updated.findIndex((v) => v.column == columnId);
    if (newOrder) {
      const newColumnOrder: OrderByItem = { column: columnId, order: newOrder };
      if (existingIndex != -1) {
        updated[existingIndex] = newColumnOrder;
      } else {
        updated.push(newColumnOrder);
      }
    } else if (existingIndex != -1) {
      updated.splice(existingIndex, 1);
    }
    orderBy.value = updated;
  } else {
    orderBy.value = newOrder ? [{ column: columnId, order: newOrder }] : [];
  }
}

function shiftThenRequestServer(entries: IntersectionObserverEntry[]): void {
  if (entries[0].isIntersecting) {
    page.value++;
  }
}

function resetCollection(): void {
  end.value = false;
  if (page.value === 1) {
    requestServer();
  } else {
    page.value = 1;
  }
}

async function requestServer(): Promise<void> {
  let currentRequestId = 0;
  let shouldDelay = false;
  try {
    hasExecFirstQuery = true;
    requesting.value = true;
    currentRequestId = ++requestId;
    const requesterValue = activeRequester.value;
    const fetch = typeof requesterValue == 'function' ? requesterValue : requesterValue.request;

    const order = Object.keys(indexedOrderBy.value).length
      ? Object.values(indexedOrderBy.value).flatMap((entry) =>
          entry.properties.map((prop) => ({ property: prop, order: entry.order })),
        )
      : undefined;

    const response = await fetch({
      entity: props.entity,
      order,
      page: page.value,
      limit: props.limit,
      filter: props.filter,
      properties: properties,
    });

    // Discard this response if a newer request has been triggered in the meantime
    if (currentRequestId !== requestId) return;

    if (typeof response != 'object' || !Array.isArray(response.collection)) {
      throw new Error(
        'invalid request response, it must be an object containing a property "collection" with an array value',
      );
    }
    count.value = response.count;
    if (props.postRequest) {
      const res = props.postRequest(response.collection);
      if (res instanceof Promise) {
        await res;
      }
    }
    if (currentRequestId !== requestId) return;

    const shouldReplace = !infiniteScroll.value || page.value <= 1;
    if (shouldReplace) collection.length = 0;
    collection.push(...response.collection);

    if (infiniteScroll.value && response.collection.length < props.limit) {
      end.value = true;
    }

    shouldDelay = !!(shouldReplace && collectionContent.value);
    if (shouldDelay) {
      // Delay to ensure the DOM has updated after collection replacement, otherwise the scroll may not trigger
      setTimeout(() => {
        collectionContent.value?.scrollTo({ top: 0, behavior: 'smooth' });
        // Delay releasing the lock to prevent the IntersectionObserver from triggering a second request
        setTimeout(() => (requesting.value = false), 30);
      }, 20);
    }
  } finally {
    if (!shouldDelay && currentRequestId === requestId) {
      requesting.value = false;
    }
  }
}

function isInfiniteAccordingProps(preferred: boolean | null = null): boolean {
  if (!props.allowedCollectionTypes.length) {
    throw new Error('allowedCollectionTypes prop must be not empty array');
  }
  for (const type of props.allowedCollectionTypes) {
    if (type != 'infinite' && type != 'pagination') {
      throw new Error('invalide allowed collection type ' + type);
    }
  }
  if (preferred !== null) {
    const preferredType = preferred ? 'infinite' : 'pagination';
    if (props.allowedCollectionTypes.includes(preferredType)) {
      return preferred;
    }
  }
  return props.allowedCollectionTypes[0] == 'infinite';
}

onMounted(async () => {
  observer = new IntersectionObserver(shiftThenRequestServer);
  if (observered.value) {
    observer.observe(observered.value);
  }

  await init();
  if (props.directQuery) {
    await requestServer();
  }
});

onUnmounted(() => {
  observer?.disconnect();
});

watch([() => props.entity, columns, orderBy], async () => {
  await init();
  resetCollection();
});
watch([() => props.filter, infiniteScroll], resetCollection);
watch(page, requestServer);
watch(
  () => props.allowedCollectionTypes,
  () => (infiniteScroll.value = isInfiniteAccordingProps(infiniteScroll.value)),
);
</script>

<template>
  <section :class="classes.collection" :aria-label="translate('collection')">
    <a v-if="builderId" :href="'#' + builderId" :class="classes.skip_link">{{ translate('go_to_filter') }}</a>
    <div>
      <div
        v-if="displayCount || !infiniteScroll || onExport || allowedCollectionTypes.length > 1"
        :class="classes.collection_header"
      >
        <div>
          <div v-if="displayCount">{{ translate('results') }} : {{ count }}</div>
        </div>
        <Pagination
          v-if="!infiniteScroll"
          v-model="page"
          :count="pageCount"
          :lock="requesting"
        />
        <div :class="classes.collection_actions">
          <IconButton v-if="onExport" icon="export" @click="() => onExport!(filter)" />
          <IconButton
            v-if="allowedCollectionTypes.length > 1"
            :icon="infiniteScroll ? 'paginated_list' : 'infinite_list'"
            @click="() => (infiniteScroll = !infiniteScroll)"
          />
          <ColumnEditor
            v-if="editColumns && entitySchema"
            v-model="columns"
            :custom-columns="customColumns"
            :entity-schema="entitySchema"
          />
        </div>
      </div>
    </div>
    <InvalidColumn v-for="columnId in invalidColumns" :key="columnId" :column="columnId" />
    <Transition name="qkit-collection-loading">
      <div v-if="requesting" :class="classes.loading" :position="infiniteScroll && page > 1 ? 'bottom' : 'top'">
        <Icon icon="loading" />
      </div>
    </Transition>
    <div ref="collectionContent" :class="classes.collection_content">
      <table :class="classes.collection_table">
        <caption :class="classes.sr_only">{{ translate('results') }}</caption>
        <thead>
          <tr>
            <Header
              v-for="columnId in computedColumns"
              :key="columnId"
              :entity-schema="entitySchema!"
              :column-id="columnId"
              :open="customColumns?.[columnId]?.open === true"
              :label="customColumns?.[columnId]?.label"
              :order="indexedOrderBy[columnId]?.order"
              :has-custom-order="customColumns?.[columnId]?.order != null"
              @click="updateOrder"
            />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(object, rowIndex) in collection"
            :key="(object[rowKeyProperty!] as string | number) ?? rowIndex"
            :class="onRowClick ? classes.collection_clickable_row : ''"
            :tabindex="onRowClick ? 0 : undefined"
            @click="(e) => $emit('rowClick', object, e)"
            @keydown.enter="(e) => (onRowClick ? $emit('rowClick', object, e) : undefined)"
          >
            <template v-for="columnId in computedColumns" :key="columnId">
              <Cell
                :column-id="columnId"
                :property="columnsProperties[columnId]"
                :row-value="object"
                :flattened="isResultFlattened"
                :user-timezone="userTimezone"
                :request-timezone="requestTimezone"
                :renderer="customColumns?.[columnId]?.renderer"
                @click="customColumns?.[columnId]?.onCellClick"
              />
            </template>
          </tr>
          <tr v-show="showInfiniteScrollObserver" ref="observered" style="opacity: 0">
            <td :colspan="computedColumns.length">plooooooop</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
