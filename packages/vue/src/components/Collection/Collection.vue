<script setup lang="ts">
import {
  ref,
  reactive,
  watch,
  watchEffect,
  onMounted,
  onUnmounted,
  shallowRef,
  shallowReactive,
  computed,
  useTemplateRef,
} from 'vue';
import { requester as baseRequester } from '@core/Requester';
import { classes } from '@core/ClassManager';
import { resolve, getPropertyPath, type Property, type EntitySchema } from '@core/EntitySchema';
import { PropertyNotFoundError } from '@core/errors';
import { translate } from '@i18n/i18n';
import { config as globalConfig } from '@config/config';
import Icon from '@components/Common/Icon.vue';
import IconButton from '@components/Common/IconButton.vue';
import Pagination from '@components/Pagination/Pagination.vue';
import Cell from '@components/Collection/Cell.vue';
import Header from '@components/Collection/Header.vue';
import ColumnEditor from '@components/Collection/ColumnEditor.vue';
import InvalidColumn from '@components/Messages/InvalidColumn.vue';
import type {
  CustomColumnConfig,
  SortItem,
  CollectionType,
  CollectionConfig,
  Requester,
  RequesterFunction,
  Filter,
} from '@core/types';

interface Props {
  entity: string;
  customColumns?: Record<string, CustomColumnConfig>;
  filter?: Filter;
  directQuery?: boolean;
  limit?: number;
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

interface IndexedSortEntry {
  order: 'asc' | 'desc';
  properties: string[];
}
const columns = defineModel<string[]>('columns', { required: true });
const sort = defineModel<(string | SortItem)[]>('sort');
const page = defineModel<number>('page', { default: 1 });

// undefined: prevent Vue from casting absent boolean props to false
const props = withDefaults(defineProps<Props>(), {
  directQuery: true,
  quickSort: undefined,
  displayCount: undefined,
  editColumns: undefined,
});

let hasExecFirstQuery = false;
let requestId = 0;
let properties: string[] = [];
const requesting = ref<boolean>(false);
const columnsProperties = shallowRef<Record<string, Property | undefined>>({});
const collection = shallowReactive<Record<string, unknown>[]>([]);
const count = ref<number>(0);
const limit = ref<number | undefined>();
const end = ref<boolean>(false);
const collectionContent = useTemplateRef<HTMLDivElement>('collectionContent');
const entitySchema = ref<EntitySchema>();
const rowKeyProperty = ref<string>();
const indexedSort = shallowRef<Record<string, IndexedSortEntry>>({});
const invalidColumns = ref<string[]>([]);
const config = reactive<CollectionConfig>({} as CollectionConfig);
const observered = useTemplateRef<HTMLTableRowElement>('observered');
const infiniteScroll = ref<boolean>(
  (props.allowedCollectionTypes ?? globalConfig.allowedCollectionTypes)[0] === 'infinite',
);
let observer: IntersectionObserver | undefined;
let requestTimeoutId: ReturnType<typeof setTimeout> | undefined;

const activeRequester = computed<Requester | RequesterFunction>(() => {
  const requester = props.requester ?? baseRequester;
  if (!requester) {
    throw new Error('requester is required, either as a prop or registered globally via plugin options');
  }
  return requester;
});

const computedColumns = computed<string[]>(() => Object.keys(columnsProperties.value));

const showInfiniteScrollObserver = computed(() => {
  return infiniteScroll.value && !end.value && !requesting.value && hasExecFirstQuery;
});

const pageCount = computed(() => (limit.value ? Math.max(1, Math.ceil(count.value / limit.value)) : 0));

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

async function init(): Promise<void> {
  entitySchema.value = await resolve(props.entity);
  await initColumns(entitySchema.value);
  await initSort(sort.value, computedColumns.value, entitySchema.value!.id, props.customColumns);
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
        properties.push(columnId);
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

async function initSort(
  sort: (string | SortItem)[] | undefined,
  columns: string[],
  entity: string,
  customColumns?: Record<string, CustomColumnConfig>,
): Promise<void> {
  if (!sort) {
    indexedSort.value = {};
    return;
  }
  const indexed: Record<string, IndexedSortEntry> = {};
  for (const value of sort) {
    try {
      const column = typeof value == 'string' ? value : value.column;
      if (!columns.includes(column)) continue;
      const order = typeof value == 'string' ? ('asc' as const) : ((value.order || 'asc') as 'asc' | 'desc');

      let reqProps: string[];
      if (customColumns?.[column]?.sort) {
        reqProps = customColumns[column].sort!;
      } else {
        const propertyPath = await getPropertyPath(entity, column);
        const property = propertyPath[propertyPath.length - 1];

        if (property.type === 'object' || property.type === 'relationship') {
          const schema = await resolve(property.entity!);
          if (schema.natural_sort?.length) {
            reqProps = schema.natural_sort.map((prop) => column + '.' + prop);
          } else {
            const idProperty = schema.unique_identifier;
            reqProps = [column + '.' + idProperty];
          }
        } else {
          reqProps = [column];
        }
      }
      indexed[column] = { order, properties: reqProps };
    } catch (e) {
      if (!(e instanceof PropertyNotFoundError)) throw e;
    }
  }
  indexedSort.value = indexed;
}

function nextOrder(current: 'asc' | 'desc' | undefined): 'asc' | 'desc' | undefined {
  if (!current) return 'asc';
  if (current === 'asc') return 'desc';
  return undefined;
}

function updateSort(columnId: string | undefined, multi: boolean): void {
  if (!columnId) {
    return;
  }
  const currentOrder = indexedSort.value[columnId]?.order;
  const newOrder = nextOrder(currentOrder);
  if (multi) {
    const updated: SortItem[] = Object.entries(indexedSort.value).map(([col, entry]) => ({
      column: col,
      order: entry.order,
    }));
    const existingIndex = updated.findIndex((v) => v.column == columnId);
    if (newOrder) {
      const newColumnSort: SortItem = { column: columnId, order: newOrder };
      if (existingIndex != -1) {
        updated[existingIndex] = newColumnSort;
      } else {
        updated.push(newColumnSort);
      }
    } else if (existingIndex != -1) {
      updated.splice(existingIndex, 1);
    }
    sort.value = updated;
  } else {
    sort.value = newOrder ? [{ column: columnId, order: newOrder }] : [];
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

    const sortRequest = Object.keys(indexedSort.value).length
      ? Object.values(indexedSort.value).flatMap((entry) =>
          entry.properties.map((prop) => ({ property: prop, order: entry.order })),
        )
      : undefined;

    const response = await fetch({
      entity: props.entity,
      sort: sortRequest,
      page: page.value,
      limit: limit.value,
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
    limit.value = response.limit;
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

    if (infiniteScroll.value && response.collection.length < limit.value!) {
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

function isInfiniteAccordingConfig(): boolean {
  if (!config.allowedCollectionTypes.length) {
    throw new Error('allowedCollectionTypes prop must be not empty array');
  }
  for (const type of config.allowedCollectionTypes) {
    if (type != 'infinite' && type != 'pagination') {
      throw new Error('invalide allowed collection type ' + type);
    }
  }
  const preferredType = infiniteScroll.value ? 'infinite' : 'pagination';
  return config.allowedCollectionTypes.includes(preferredType)
    ? infiniteScroll.value
    : config.allowedCollectionTypes[0] == 'infinite';
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
  if (requestTimeoutId) clearTimeout(requestTimeoutId);
});

// Must be before the other watches: config must be populated before isInfiniteAccordingConfig runs
watchEffect(() => {
  config.userTimezone = props.userTimezone ?? globalConfig.userTimezone;
  config.requestTimezone = props.requestTimezone ?? globalConfig.requestTimezone;
  config.quickSort = props.quickSort ?? globalConfig.quickSort;
  config.displayCount = props.displayCount ?? globalConfig.displayCount;
  config.editColumns = props.editColumns ?? globalConfig.editColumns;
  config.allowedCollectionTypes = props.allowedCollectionTypes ?? globalConfig.allowedCollectionTypes;
});
watchEffect(() => {
  limit.value = props.limit ?? globalConfig.limit;
});
watch([() => props.entity, columns, sort], async (newVals, oldVals) => {
  await init();
  if (requestTimeoutId) clearTimeout(requestTimeoutId);
  requestTimeoutId = undefined;
  const onlySortChanged = newVals[0] === oldVals[0] && newVals[1] === oldVals[1];
  if (onlySortChanged) {
    // Debounce the server request so the user can quickly update
    // the sort without triggering intermediate requests.
    requestTimeoutId = setTimeout(() => resetCollection(), 500);
  } else {
    resetCollection();
  }
});
watch([() => props.filter, infiniteScroll], resetCollection);
watch(page, requestServer);
watch(
  () => config.allowedCollectionTypes,
  () => (infiniteScroll.value = isInfiniteAccordingConfig()),
  { immediate: true },
);
</script>

<template>
  <section :class="classes.collection" :aria-label="translate('collection')">
    <a v-if="builderId" :href="'#' + builderId" :class="classes.skip_link">{{ translate('go_to_filter') }}</a>
    <div>
      <div
        v-if="
          config.displayCount ||
          !infiniteScroll ||
          onExport ||
          config.allowedCollectionTypes.length > 1 ||
          config.editColumns
        "
        :class="classes.collection_header"
      >
        <div>
          <div v-if="config.displayCount">{{ translate('results') }} : {{ count }}</div>
        </div>
        <Pagination v-if="!infiniteScroll && pageCount" v-model="page" :count="pageCount" :lock="requesting" />
        <div :class="classes.collection_actions">
          <IconButton v-if="onExport" icon="export" @click="() => onExport!(filter)" />
          <IconButton
            v-if="config.allowedCollectionTypes.length > 1"
            :icon="infiniteScroll ? 'paginated_list' : 'infinite_list'"
            @click="() => (infiniteScroll = !infiniteScroll)"
          />
          <ColumnEditor
            v-if="config.editColumns && entitySchema"
            v-model="columns"
            :custom-columns="customColumns"
            :entity-schema="entitySchema"
          />
        </div>
      </div>
    </div>
    <div v-if="invalidColumns.length" :class="classes.error_message_bag">
      <InvalidColumn v-for="columnId in invalidColumns" :key="columnId" :column="columnId" />
    </div>
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
              :order="indexedSort[columnId]?.order"
              :has-custom-sort="customColumns?.[columnId]?.sort != null"
              @click="updateSort"
            />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(object, rowIndex) in collection"
            :key="(object[rowKeyProperty!] as string | number) ?? rowIndex"
            :class="onRowClick ? classes.collection_clickable_row : ''"
            :tabindex="onRowClick ? 0 : undefined"
            v-on="rowEvents(object)"
          >
            <template v-for="columnId in computedColumns" :key="columnId">
              <Cell
                :column-id="columnId"
                :property="columnsProperties[columnId]"
                :row-value="object"
                :renderer="customColumns?.[columnId]?.renderer"
                :user-timezone="config.userTimezone"
                :request-timezone="config.requestTimezone"
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
