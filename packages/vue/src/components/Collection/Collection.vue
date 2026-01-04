<script setup>
import { ref, watch, onMounted, onUnmounted, shallowRef, computed, toRaw, useTemplateRef } from 'vue';
import { requester as baseRequester } from '@core/Requester';
import { classes } from '@core/ClassManager';
import { resolve, getPropertyPath } from '@core/EntitySchema';
import { translate } from '@i18n/i18n';
import IconButton from '@components/Common/IconButton.vue';
import Pagination from '@components/Pagination/Pagination.vue';
import Cell from '@components/Collection/Cell.vue';
import Header from '@components/Collection/Header.vue';
import ColumnChoices from '@components/Collection/ColumnChoices.vue';

const emit = defineEmits(['rowClick', 'export', 'update:columns', 'update:orderBy']);
const props = defineProps({
  entity: {
    type: String,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
  },
  customColumns: {
    type: Object,
    default: undefined,
  },
  filter: {
    type: Object,
    default: undefined,
  },
  directQuery: {
    type: Boolean,
    required: true,
  },
  limit: {
    type: Number,
    required: true,
  },
  offset: {
    type: Number,
    default: 0,
  },
  id: {
    type: String,
    default: undefined,
  },
  onRowClick: {
    type: Function,
    default: undefined,
  },
  quickSort: {
    type: Boolean,
    default: true,
  },
  orderBy: {
    type: Array,
    default: undefined,
  },
  postRequest: {
    type: Function,
    default: undefined,
  },
  allowedCollectionTypes: {
    type: Array,
    default() {
      return ['pagination'];
    },
  },
  displayCount: {
    type: Boolean,
  },
  onExport: {
    type: Function,
    default: undefined,
  },
  userTimezone: {
    type: String,
    default: 'UTC',
  },
  requestTimezone: {
    type: String,
    default: 'UTC',
  },
  editColumns: {
    type: Boolean,
  },
  requester: {
    type: [Object, Function],
    validator(value) {
      return typeof value == 'function' || (typeof value == 'object' && typeof value.request == 'function');
    },
    default: undefined,
  },
});

let hasExecFirstQuery = false;
let movingOffset = 0;
let requestProperties = [];
const requesting = ref(false);
const copiedColumns = shallowRef([]);
const propertyColumns = shallowRef([]);
const collection = shallowRef([]);
const count = ref(0);
const end = ref(false);
const copiedOrderBy = ref([]);
const page = ref(1);
const infiniteScroll = ref(isInfiniteAccordingProps());
const collectionContent = useTemplateRef('collectionContent');
const showColumnsModal = ref(false);

const observered = useTemplateRef('observered');
let observer;

const isResultFlattened = computed(() => {
  return props.requester && typeof props.requester == 'object' ? props.requester.flattened : baseRequester.flattened;
});

const indexedOrderBy = computed(() => {
  const indexed = {};
  for (const order of copiedOrderBy.value) {
    indexed[order.column] = order.order;
  }
  return indexed;
});

async function init(fetch = true) {
  await initColumns(props.columns, props.orderBy, fetch);
}

async function initColumns(columns, orderBy, fetch = true) {
  if (!(await resolve(props.entity))) {
    throw new Error(`invalid entity "${props.entity}"`);
  }
  const properties = [];
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
        const propertySchema = await resolve(property.related);
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

function initOrderBy(orderBy, fetch = true) {
  copiedOrderBy.value = orderBy
    ? orderBy
        .map((value) => {
          const column = typeof value == 'string' ? value : value.column;
          return copiedColumns.value.includes(column)
            ? typeof value == 'string'
              ? { column: column, order: 'asc' }
              : { column: column, order: value.order?.toLowerCase() || 'asc' }
            : null;
        })
        .filter((value) => value != null)
    : [];

  if (fetch) {
    requestServer(true);
  }
}

async function updateColumns(columns) {
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

function updateOrder(columnId, multi) {
  if (!requesting.value) {
    let orderBy = structuredClone(toRaw(copiedOrderBy.value));
    const newOrder = indexedOrderBy.value[columnId] == 'asc' && (orderBy.length <= 1 || multi) ? 'desc' : 'asc';
    const newColumnOrder = { column: columnId, order: newOrder };
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

async function shiftThenRequestServer() {
  if (!requesting.value && hasExecFirstQuery) {
    movingOffset += props.limit;
    requestServer();
  }
}

async function updatePage(newPage) {
  if (!requesting.value) {
    page.value = newPage;
    movingOffset = (page.value - 1) * props.limit;
    requestServer();
  }
}

async function requestServer(reset = false) {
  if (reset) {
    end.value = false;
    movingOffset = 0;
    page.value = 1;
    collectionContent.value.scrollTop = 0;
  }
  hasExecFirstQuery = true;
  requesting.value = true;
  const fetch = props.requester
    ? typeof props.requester == 'function'
      ? props.requester
      : props.requester.request
    : baseRequester.request;

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
      'invalid request response, it must be an object containing a property "collection" with an array value'
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

async function getRequestOrder() {
  const orderBy = [];
  for (const order of copiedOrderBy.value) {
    if (props.customColumns?.[order.column]?.order) {
      orderBy.push(
        ...props.customColumns[order.column].order.map((customOrderProperty) => {
          return { property: customOrderProperty, order: order.order };
        })
      );
    } else {
      const propertyPath = await getPropertyPath(props.entity, order.column);
      const property = propertyPath[propertyPath.length - 1];

      if (property.type != 'relationship') {
        orderBy.push({ property: order.column, order: order.order });
        continue;
      }
      const schema = await resolve(property.related);
      if (schema.natural_sort) {
        orderBy.push(
          ...schema.natural_sort.map((property) => {
            return { property: order.column + '.' + property, order: order.order };
          })
        );
        continue;
      }
      const idProperty = schema.unique_identifier || 'id';
      orderBy.push({ property: order.column + '.' + idProperty, order: order.order });
    }
  }
  return orderBy;
}

function isInfiniteAccordingProps() {
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

function initColumnsModal() {
  showColumnsModal.value = true;
}

onMounted(async () => {
  observer = new IntersectionObserver(shiftThenRequestServer);
  observer.observe(observered.value);

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
  }
);
watch(
  () => props.columns,
  async () => {
    await initColumns(props.columns, copiedOrderBy.value);
  }
);
watch(
  () => props.orderBy,
  () => {
    initOrderBy(props.orderBy);
  }
);
watch(
  () => props.filter,
  () => requestServer(true)
);
watch(infiniteScroll, () => requestServer(true));
watch(
  () => props.allowedCollectionTypes,
  () => (infiniteScroll.value = isInfiniteAccordingProps())
);
</script>

<template>
  <div :id="id" :class="classes.collection" tabindex="0" :aria-label="translate('results')">
    <slot name="shortcuts" />
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
          :page="page"
          :count="Math.max(1, Math.ceil(count / limit))"
          :lock="requesting"
          @update="updatePage"
        />
        <div :class="classes.collection_actions">
          <IconButton v-if="onExport" icon="export" @click="() => $emit('export', filter)" />
          <IconButton
            v-if="allowedCollectionTypes.length > 1"
            :icon="infiniteScroll ? 'paginated_list' : 'infinite_list'"
            @click="() => (infiniteScroll = !infiniteScroll)"
          />
          <IconButton v-if="editColumns" icon="columns" @click="initColumnsModal" />
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
              v-for="object in collection"
              :key="object.id"
              :class="onRowClick ? classes.collection_clickable_row : ''"
              @click="(e) => $emit('rowClick', object, e)"
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
    <ColumnChoices
      v-if="editColumns"
      v-model:show="showColumnsModal"
      :columns="copiedColumns"
      :custom-columns="customColumns"
      :entity="entity"
      @update:columns="updateColumns"
    />
  </div>
</template>
