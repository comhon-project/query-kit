<script setup>
import { ref, watch, onMounted, toRaw, shallowRef, computed } from 'vue';
import { requester as baseRequester } from '../../core/Requester';
import { classes } from '../../core/ClassManager';
import { resolve, getPropertyPath } from '../../core/Schema';
import { translate } from '../../i18n/i18n';
import IconButton from '../Common/IconButton.vue';
import Pagination from '../Pagination/Pagination.vue';
import Cell from './Cell.vue';
import Header from './Header.vue';

defineEmits(['rowClick', 'export']);
const props = defineProps({
  model: {
    type: String,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
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
  requester: {
    type: [Object, Function],
    validator(value) {
      return typeof value == 'function' || (typeof value == 'object' && typeof value.request == 'function');
    },
    default: undefined,
  },
});

let movingOffset = 0;
let computedProperties = [];
const requesting = ref(false);
const schema = shallowRef(null);
const computedColumns = shallowRef([]);
const collection = shallowRef([]);
const count = ref(0);
const end = ref(false);
const active = ref(null);
const order = ref(null);
const page = ref(1);
const infiniteScroll = ref(isInfiniteAccordingProps());
const collectionContent = ref(null);

const observered = ref(null);
let observer;

const isResultFlattened = computed(() => {
  return props.requester && typeof props.requester == 'object' ? props.requester.flattened : baseRequester.flattened;
});

async function init() {
  schema.value = await resolve(props.model);
  if (!schema.value) {
    throw new Error(`invalid model "${props.model}"`);
  }
  const tempColumns = [];
  computedProperties = [];

  for (const column of props.columns) {
    const computedColumn = typeof column == 'object' ? Object.assign({}, column) : { id: column };
    tempColumns.push(computedColumn);

    if (computedColumn.id) {
      const propertyPath = await getPropertyPath(props.model, computedColumn.id);
      computedColumn.property = propertyPath[propertyPath.length - 1];
    }
    if (computedColumn.renderer) {
      computedColumn.renderer = toRaw(computedColumn.renderer);
    }
    if (computedColumn.property) {
      if (props.quickSort && computedColumn.order && ['asc', 'desc'].includes(computedColumn.order.toLowerCase())) {
        active.value = computedColumn.id;
        order.value = computedColumn.order.toLowerCase();
      }

      if (computedColumn.property.type != 'relationship') {
        computedProperties.push(computedColumn.id);
      } else if (
        computedColumn.property.relationship_type == 'belongs_to' ||
        computedColumn.property.relationship_type == 'has_one'
      ) {
        const propertySchema = await resolve(computedColumn.property.model);
        computedProperties.push(computedColumn.id + '.' + (propertySchema.unique_identifier || 'id'));
        if (propertySchema.primary_identifiers) {
          for (const propertyId of propertySchema.primary_identifiers) {
            computedProperties.push(computedColumn.id + '.' + propertyId);
          }
        }
      }
    }
  }
  computedColumns.value = tempColumns;
}

async function shiftThenRequestServer() {
  if (!requesting.value) {
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
  requesting.value = true;
  const fetch = props.requester
    ? typeof props.requester == 'function'
      ? props.requester
      : props.requester.request
    : baseRequester.request;

  const response = await fetch({
    model: props.model,
    order: active.value ? await getRequestOrder() : undefined,
    offset: movingOffset,
    limit: props.limit,
    filter: props.filter,
    properties: computedProperties,
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

function updateOrder(property) {
  if (!requesting.value) {
    order.value = active.value != property || order.value == 'desc' ? 'asc' : 'desc';
    active.value = property;
    requestServer(true);
  }
}

async function getRequestOrder() {
  const propertyPath = await getPropertyPath(props.model, active.value);
  const property = propertyPath[propertyPath.length - 1];

  if (property.type != 'relationship') {
    return [{ property: active.value, order: order.value }];
  }
  const schema = await resolve(property.model);
  if (schema.natural_sort) {
    return schema.natural_sort.map((property) => {
      return { property: active.value + '.' + property, order: order.value };
    });
  }
  const idProperty = schema.unique_identifier || 'id';
  return [{ property: active.value + '.' + idProperty, order: order.value }];
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

onMounted(async () => {
  movingOffset = props.offset;
  await init(true);
  observer = new IntersectionObserver(shiftThenRequestServer);
  observer.observe(observered.value);
  if (props.directQuery) {
    requestServer();
  }
});
watch(
  () => props.model,
  () => init(true)
);
watch(
  () => props.columns,
  () => init(false)
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
                v-for="computedColumn in computedColumns"
                :key="computedColumn.id"
                :model="model"
                :property-id="computedColumn.id"
                :label="computedColumn.label"
                :active="active == computedColumn.id"
                :order="order"
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
              <template v-for="computedColumn in computedColumns" :key="computedColumn.id">
                <Cell
                  :column="computedColumn"
                  :row-value="object"
                  :flattened="isResultFlattened"
                  :user-timezone="userTimezone"
                  :request-timezone="requestTimezone"
                />
              </template>
            </tr>
          </tbody>
        </table>
        <div v-show="infiniteScroll && !end && !requesting" ref="observered" style="height: 1px" />
      </div>
    </div>
  </div>
</template>
