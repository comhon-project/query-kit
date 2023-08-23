<script setup>
import { ref, watch, onMounted, toRaw, shallowRef, computed } from 'vue';
import { requester } from '../../core/Requester';
import { classes } from '../../core/ClassManager';
import { resolve } from '../../core/Schema';
import { translate } from '../../i18n/i18n';
import IconButton from '../Common/IconButton.vue';
import Pagination from '../Pagination/Pagination.vue';
import Cell from './Cell.vue';
import Header from './Header.vue';

const emit = defineEmits(['rowClick', 'export']);
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
  },
  onRowClick: {
    type: Function,
  },
  quickSort: {
    type: Boolean,
    default: true,
  },
  postRequest: {
    type: Function,
  },
  allowedCollectionTypes: {
    type: Array,
    default: ['pagination'],
  },
  displayCount: {
    type: Boolean,
  },
  onExport: {
    type: Function,
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
  },
});

let movingOffset = props.offset;
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
  return props.requester && typeof props.requester == 'object' ? props.requester.flattened : requester.flattened;
});

async function init() {
  schema.value = await resolve(props.model);
  if (!schema.value) {
    throw new Error(`invalid model "${props.model}"`);
  }
  const tempColumns = [];
  computedProperties = [];

  for (const column of props.columns) {
    let computedColumn = typeof column == 'object' ? Object.assign({}, column) : { id: column };
    const propertyPath = await getPropertyPath(computedColumn);
    const property = propertyPath[propertyPath.length - 1];
    computedColumn.property = property;
    if (computedColumn.label == null) {
      computedColumn.label = property.name;
    }
    if (props.quickSort) {
      computedColumn.sortable = await isSortable(propertyPath);
      if (
        computedColumn.sortable &&
        computedColumn.order &&
        ['asc', 'desc'].includes(computedColumn.order.toLowerCase())
      ) {
        active.value = computedColumn.id;
        order.value = computedColumn.order.toLowerCase();
      }
    }
    if (computedColumn.component) {
      computedColumn.component = toRaw(computedColumn.component);
    }
    tempColumns.push(computedColumn);

    if (computedColumn.property.type != 'relationship') {
      computedProperties.push(computedColumn.id);
    } else if (
      computedColumn.property.relationship_type == 'belongs_to' ||
      computedColumn.property.relationship_type == 'has_one'
    ) {
      const propertySchema = await resolve(property.model);
      computedProperties.push(computedColumn.id + '.' + (propertySchema.unique_identifier || 'id'));
      if (propertySchema.primary_identifiers) {
        for (const propertyId of propertySchema.primary_identifiers) {
          computedProperties.push(computedColumn.id + '.' + propertyId);
        }
      }
    }
  }
  computedColumns.value = tempColumns;
}

async function isSortable(propertyPath) {
  let currentSchema = schema.value;
  for (let property of propertyPath) {
    if (
      !currentSchema.search ||
      !Array.isArray(currentSchema.search.sort) ||
      !currentSchema.search.sort.includes(property.id)
    ) {
      return false;
    }
    if (property.model) {
      // add condition just for the very last property that probably don't have model
      currentSchema = await resolve(property.model);
    }
  }
  return true;
}

async function getPropertyPath(computedColumn) {
  const propertyPath = [];
  const splited = computedColumn.id.split('.');
  let propertyName = '';
  let currentSchema = schema.value;
  for (let i = 0; i < splited.length - 1; i++) {
    propertyName = propertyName.length ? `${propertyName}.${splited[i]}` : splited[i];
    const property = currentSchema.mapProperties[propertyName];
    if (!property) {
      continue;
    }
    propertyPath.push(property);
    currentSchema = await resolve(property.model);
    if (!currentSchema) {
      throw new Error(`invalid model "${property.model}"`);
    }
    propertyName = '';
  }
  const last = splited[splited.length - 1];
  propertyName = propertyName.length ? `${propertyName}.${last}` : last;
  if (!currentSchema.mapProperties[propertyName]) {
    throw new Error(`invalid collection property "${computedColumn.id}"`);
  }
  propertyPath.push(currentSchema.mapProperties[propertyName]);
  return propertyPath;
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
    : requester.request;

  const response = await fetch({
    model: props.model,
    order: active.value ? [{ property: active.value, order: order.value }] : undefined,
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
  <div :class="classes.collection" :id="id" tabindex="0" :aria-label="translate('results')">
    <slot name="shortcuts"></slot>
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
          <div v-if="requesting" :class="classes.spinner"></div>
        </Transition>
      </slot>
      <div ref="collectionContent" :class="classes.collection_content">
        <table :class="classes.collection_table">
          <thead>
            <tr>
              <Header
                v-for="computedColumn in computedColumns"
                :key="computedColumn.id"
                :column="computedColumn"
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
        <div v-show="infiniteScroll && !end && !requesting" ref="observered" style="height: 1px"></div>
      </div>
    </div>
  </div>
</template>
