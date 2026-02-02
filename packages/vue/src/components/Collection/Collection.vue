<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, shallowRef, computed, toRaw, useTemplateRef } from 'vue';
import { requester as baseRequester } from '@core/Requester';
import { classes } from '@core/ClassManager';
import { resolve, getPropertyPath, type Property } from '@core/EntitySchema';
import { translate } from '@i18n/i18n';
import IconButton from '@components/Common/IconButton.vue';
import Pagination from '@components/Pagination/Pagination.vue';
import Cell from '@components/Collection/Cell.vue';
import Header from '@components/Collection/Header.vue';
import ColumnEditor from '@components/Collection/ColumnEditor.vue';
import type { CustomColumnConfig, OrderByItem, CollectionType, Requester, RequesterFunction } from '@core/types';

interface Props {
  entity: string;
  columns: string[];
  customColumns?: Record<string, CustomColumnConfig>;
  filter?: Record<string, unknown>;
  directQuery: boolean;
  limit: number;
  offset?: number;
  onRowClick?: (row: Record<string, unknown>, event: MouseEvent | KeyboardEvent) => void;
  quickSort?: boolean;
  orderBy?: (string | OrderByItem)[];
  postRequest?: (collection: Record<string, unknown>[]) => void | Promise<void>;
  allowedCollectionTypes?: CollectionType[];
  displayCount?: boolean;
  onExport?: (filter?: Record<string, unknown>) => void;
  userTimezone?: string;
  requestTimezone?: string;
  editColumns?: boolean;
  requester?: Requester | RequesterFunction;
  builderId?: string;
}

interface Emits {
  rowClick: [row: Record<string, unknown>, event: MouseEvent | KeyboardEvent];
  'update:columns': [columns: string[]];
  'update:orderBy': [orderBy: OrderByItem[]];
  goToBuilder: [];
}

const emit = defineEmits<Emits>();
const props = withDefaults(defineProps<Props>(), {
  offset: 0,
  quickSort: true,
  allowedCollectionTypes: () => ['pagination'],
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
});

let hasExecFirstQuery = false;
let movingOffset = 0;
let requestProperties: string[] = [];
const requesting = ref<boolean>(false);
const copiedColumns = shallowRef<string[]>([]);
const propertyColumns = shallowRef<(Property | undefined)[]>([]);
const collection = shallowRef<Record<string, unknown>[]>([]);
const count = ref<number>(0);
const end = ref<boolean>(false);
const copiedOrderBy = ref<OrderByItem[]>([]);
const page = ref<number>(1);
const infiniteScroll = ref<boolean>(isInfiniteAccordingProps());
const collectionContent = useTemplateRef<HTMLDivElement>('collectionContent');
const rowKeyProperty = ref<string>();

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

const indexedOrderBy = computed<Record<string, 'asc' | 'desc'>>(() => {
  const indexed: Record<string, 'asc' | 'desc'> = {};
  for (const order of copiedOrderBy.value) {
    indexed[order.column] = order.order;
  }
  return indexed;
});

async function init(fetch = true): Promise<void> {
  await initColumns(props.columns, props.orderBy, fetch);
}

async function initColumns(columns: string[], orderBy?: (string | OrderByItem)[], fetch = true): Promise<void> {
  const schema = await resolve(props.entity);
  rowKeyProperty.value = schema.unique_identifier;
  const properties: (Property | undefined)[] = [];
  requestProperties = [];

  for (const columnId of columns) {
    const propertyPath = props.customColumns?.[columnId]?.open
      ? undefined
      : await getPropertyPath(props.entity, columnId);
    const property = propertyPath?.[propertyPath.length - 1];
    properties.push(property);

    if (property) {
      if (property.type != 'relationship') {
        requestProperties.push(columnId);
      } else if (property.relationship_type == 'belongs_to' || property.relationship_type == 'has_one') {
        const propertySchema = await resolve(property.related!);
        requestProperties.push(columnId + '.' + (propertySchema.unique_identifier || 'id'));
        if (propertySchema.primary_identifiers) {
          for (const propertyId of propertySchema.primary_identifiers) {
            requestProperties.push(columnId + '.' + propertyId);
          }
        }
      }
    }
  }
  copiedColumns.value = [...columns];
  propertyColumns.value = properties;
  initOrderBy(orderBy, fetch);
}

function initOrderBy(orderBy?: (string | OrderByItem)[], fetch = true): void {
  copiedOrderBy.value = orderBy
    ? orderBy
        .map((value) => {
          const column = typeof value == 'string' ? value : value.column;
          return copiedColumns.value.includes(column)
            ? typeof value == 'string'
              ? { column: column, order: 'asc' as const }
              : { column: column, order: (value.order || 'asc') as 'asc' | 'desc' }
            : null;
        })
        .filter((value): value is OrderByItem => value != null)
    : [];

  if (fetch) {
    requestServer(true);
  }
}

async function updateColumns(columns: string[]): Promise<void> {
  emit('update:columns', columns);

  setTimeout(async () => {
    if (!requesting.value) {
      // we init only if the collection is not requesting.
      // if requesting that means props.columns is used with v-model
      // and initialization has been made through the props.columns watcher
      await initColumns(columns, copiedOrderBy.value);
    }
  }, 0);
}

function updateOrder(columnId: string | undefined, multi: boolean): void {
  if (!requesting.value && columnId) {
    let orderBy = structuredClone(toRaw(copiedOrderBy.value));
    const newOrder: 'asc' | 'desc' =
      indexedOrderBy.value[columnId] == 'asc' && (orderBy.length <= 1 || multi) ? 'desc' : 'asc';
    const newColumnOrder: OrderByItem = { column: columnId, order: newOrder };
    if (multi) {
      const index = orderBy.findIndex((value) => value.column == columnId);
      if (index != -1) {
        orderBy[index] = newColumnOrder;
      } else {
        orderBy.push(newColumnOrder);
      }
    } else {
      orderBy = [newColumnOrder];
    }

    emit('update:orderBy', orderBy);
    setTimeout(async () => {
      if (!requesting.value) {
        // we init only if the collection is not requesting.
        // if requesting that means props.orderBy is used with v-model
        // and initialization has been made through the props.orderBy watcher
        initOrderBy(orderBy);
      }
    }, 0);
  }
}

async function shiftThenRequestServer(): Promise<void> {
  if (!requesting.value && hasExecFirstQuery) {
    movingOffset += props.limit;
    requestServer();
  }
}

async function updatePage(newPage: number): Promise<void> {
  if (!requesting.value) {
    page.value = newPage;
    movingOffset = (page.value - 1) * props.limit;
    requestServer();
  }
}

async function requestServer(reset = false): Promise<void> {
  if (reset) {
    end.value = false;
    movingOffset = 0;
    page.value = 1;
    if (collectionContent.value) {
      collectionContent.value.scrollTop = 0;
    }
  }
  hasExecFirstQuery = true;
  requesting.value = true;
  const requesterValue = activeRequester.value;
  const fetch = typeof requesterValue == 'function' ? requesterValue : requesterValue.request;

  const response = await fetch({
    entity: props.entity,
    order: copiedOrderBy.value.length ? await getRequestOrder() : undefined,
    offset: movingOffset,
    limit: props.limit,
    filter: props.filter,
    properties: requestProperties,
  });
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
  if (reset || !infiniteScroll.value) {
    collection.value = response.collection;
  } else {
    for (const element of response.collection) {
      collection.value.push(element);
    }
  }
  if (infiniteScroll.value && response.collection.length < props.limit) {
    end.value = true;
  }
  requesting.value = false;
}

async function getRequestOrder(): Promise<{ property: string; order: string }[]> {
  const orderBy: { property: string; order: string }[] = [];
  for (const order of copiedOrderBy.value) {
    if (props.customColumns?.[order.column]?.order) {
      orderBy.push(
        ...props.customColumns[order.column].order!.map((customOrderProperty) => {
          return { property: customOrderProperty, order: order.order };
        }),
      );
    } else {
      const propertyPath = await getPropertyPath(props.entity, order.column);
      const property = propertyPath[propertyPath.length - 1];

      if (property.type != 'relationship') {
        orderBy.push({ property: order.column, order: order.order });
        continue;
      }
      const schema = await resolve(property.related!);
      if (schema.default_sort) {
        orderBy.push(
          ...schema.default_sort.map((prop) => {
            return { property: order.column + '.' + prop, order: order.order };
          }),
        );
        continue;
      }
      const idProperty = schema.unique_identifier || 'id';
      orderBy.push({ property: order.column + '.' + idProperty, order: order.order });
    }
  }
  return orderBy;
}

function isInfiniteAccordingProps(): boolean {
  if (!props.allowedCollectionTypes.length) {
    throw new Error('allowedCollectionTypes prop must be not empty array');
  }
  for (const type of props.allowedCollectionTypes) {
    if (type != 'infinite' && type != 'pagination') {
      throw new Error('invalide allowed collection type ' + type);
    }
  }
  return props.allowedCollectionTypes[0] == 'infinite';
}

onMounted(async () => {
  observer = new IntersectionObserver(shiftThenRequestServer);
  if (observered.value) {
    observer.observe(observered.value);
  }

  movingOffset = props.offset;
  await init(false);
  if (props.directQuery) {
    requestServer();
  }
});
onUnmounted(() => {
  observer?.disconnect();
});
watch(
  () => props.entity,
  async () => {
    await init(true);
  },
);
watch(
  () => props.columns,
  async () => {
    await initColumns(props.columns, copiedOrderBy.value);
  },
);
watch(
  () => props.orderBy,
  () => {
    initOrderBy(props.orderBy);
  },
);
watch(
  () => props.filter,
  () => requestServer(true),
);
watch(infiniteScroll, () => requestServer(true));
watch(
  () => props.allowedCollectionTypes,
  () => (infiniteScroll.value = isInfiniteAccordingProps()),
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
          :model-value="page"
          :count="Math.max(1, Math.ceil(count / limit))"
          :lock="requesting"
          @update:model-value="updatePage"
        />
        <div :class="classes.collection_actions">
          <IconButton v-if="onExport" icon="export" @click="() => onExport!(filter)" />
          <IconButton
            v-if="allowedCollectionTypes.length > 1"
            :icon="infiniteScroll ? 'paginated_list' : 'infinite_list'"
            @click="() => (infiniteScroll = !infiniteScroll)"
          />
          <ColumnEditor
            v-if="editColumns"
            :model-value="copiedColumns"
            :custom-columns="customColumns"
            :entity="entity"
            @update:model-value="updateColumns"
          />
        </div>
      </div>
    </div>
    <div :class="classes.collection_content_wrapper">
      <slot name="loading" :requesting="requesting">
        <Transition name="qkit-collection-spinner">
          <div v-if="requesting" :class="classes.spinner" />
        </Transition>
      </slot>
      <div ref="collectionContent" :class="classes.collection_content">
        <table :class="classes.collection_table">
          <caption :class="classes.sr_only">{{ translate('results') }}</caption>
          <thead>
            <tr>
              <Header
                v-for="columnId in copiedColumns"
                :key="columnId"
                :entity="entity"
                :column-id="columnId"
                :property-id="customColumns?.[columnId]?.open === true ? undefined : columnId"
                :label="customColumns?.[columnId]?.label"
                :order="indexedOrderBy[columnId]"
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
              <template v-for="(columnId, index) in copiedColumns" :key="columnId">
                <Cell
                  :column-id="columnId"
                  :property="propertyColumns[index]"
                  :row-value="object"
                  :flattened="isResultFlattened"
                  :user-timezone="userTimezone"
                  :request-timezone="requestTimezone"
                  :renderer="customColumns?.[columnId]?.renderer"
                  @click="customColumns?.[columnId]?.onCellClick"
                />
              </template>
            </tr>
            <tr v-show="infiniteScroll && !end && !requesting" ref="observered" style="opacity: 0">
              <td :colspan="copiedColumns.length" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
