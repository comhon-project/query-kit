<script setup>
import { ref, watch, onMounted, toRaw, inject, shallowRef } from 'vue'
import { classes } from '../../core/ClassManager';
import { resolve } from '../../core/Schema';
import { translate } from '../../i18n/i18n';
import IconButton from '../Common/IconButton.vue';
import Pagination from '../Pagination/Pagination.vue';

const emit = defineEmits(['rowClick', 'export']);
const props = defineProps({
  model: {
    type: String,
    required: true
  },
  columns: {
    type: Array,
    required: true
  },
  filter: {
    type: Object,
  },
  directQuery: {
    type: Boolean,
    required: true
  },
  limit: {
    type: Number,
    required: true
  },
  offset: {
    type: Number,
    default: 0
  },
  id: {
    type: String,
  },
  onRowClick: {
    type: Function,
  },
  quickSort: {
    type: Boolean,
    default: true
  },
  postRequest: {
    type: Function,
  },
  infiniteScroll: {
    type: Boolean,
  },
  displayCount: {
    type: Boolean,
  },
  onExport: {
    type: Function,
  },
});

let movingOffset = props.offset;
const requesting = ref(false);
const requester = inject(Symbol.for('requester'));
const schema = shallowRef(null);
const computedColumns = shallowRef([]);
const collection = shallowRef([]);
const count = ref(0);
const end = ref(false);
const active = ref(null);
const order = ref(null);
const page = ref(1);

const observered = ref(null);
let observer;

async function init() {
  schema.value = await resolve(props.model);
  if (!schema.value) {
    throw new Error(`invalid model "${props.model}"`);
  }
  const tempColumns = [];

  for(const column of props.columns) {
    let computedColumn = typeof column == 'object'
        ? Object.assign({}, column)
        : {id: column};
    if (computedColumn.label == null) {
      computedColumn.label = await getLabel(computedColumn);
    }
    if (props.quickSort) {
      computedColumn.sortable = await isSortable(computedColumn);
      if (computedColumn.sortable && computedColumn.order && ['asc', 'desc'].includes(computedColumn.order.toLowerCase())) {
        active.value = computedColumn.id;
        order.value = computedColumn.order.toLowerCase();
      }
    }
    if (computedColumn.component) {
      computedColumn.component = toRaw(computedColumn.component);
    }
    tempColumns.push(computedColumn);
  }
  computedColumns.value = tempColumns;
}

async function isSortable(computedColumn) {
  if (!schema.value.search || !Array.isArray(schema.value.search.sort)) {
    return false;
  }
  const splited = computedColumn.id.split('.');
  let currentSchema = schema.value;
  for (let i = 0; i < splited.length - 1; i++) {
    if (!currentSchema.mapProperties[splited[i]]) {
      throw new Error(`invalid collection property "${computedColumn.id}"`);
    }
    if (!currentSchema.search || !Array.isArray(currentSchema.search.sort) || !currentSchema.search.sort.includes(splited[i])) {
      return false;
    }
    currentSchema = await resolve(currentSchema.mapProperties[splited[i]].model);
    if (!currentSchema) {
      throw new Error(`invalid model "${currentSchema.mapProperties[splited[i]].model}"`);
    }
  }
  return currentSchema.search.sort.includes(splited[splited.length - 1]);
}

async function getLabel(computedColumn) {
  const splited = computedColumn.id.split('.');
  let currentSchema = schema.value;
  for (let i = 0; i < splited.length - 1; i++) {
    if (!currentSchema.mapProperties[splited[i]]) {
      throw new Error(`invalid collection property "${computedColumn.id}"`);
    }
    currentSchema = await resolve(currentSchema.mapProperties[splited[i]].model);
    if (!currentSchema) {
      throw new Error(`invalid model "${currentSchema.mapProperties[splited[i]].model}"`);
    }
  }
  if (!currentSchema.mapProperties[splited[splited.length - 1]]) {
    throw new Error(`invalid collection property "${computedColumn.id}"`);
  }
  return currentSchema.mapProperties[splited[splited.length - 1]].name
}

async function shiftThenRequestServer()
{
  if (!requesting.value) {
    movingOffset += props.limit;
    requestServer();
  }
}

async function updatePage(newPage)
{
  if (!requesting.value) {
    page.value = newPage;
    movingOffset = (page.value - 1) * props.limit;
    requestServer();
  }
}

async function requestServer(reset = false)
{
  if (reset) {
    end.value = false;
    movingOffset = 0;
    page.value = 1;
  }
  requesting.value = true;
  const response = await requester.request({
    order: active.value ? [{property: active.value, order: order.value}] : undefined,
    offset: movingOffset,
    limit: props.limit,
    filter: props.filter,
    properties: computedColumns.value.map(column => column.id),
  });
  if ((typeof response != 'object') || !Array.isArray(response.collection)) {
    throw new Error('invalid request response, it must be an object containing a property "collection" with an array value');
  }
  count.value = response.count;
  if (props.postRequest) {
    const res = props.postRequest(response.collection);
    if (res instanceof Promise) {
      await res;
    }
  }
  if (reset || !props.infiniteScroll) {
    collection.value = response.collection;
  } else {
    for (const element of response.collection) {
      collection.value.push(element);
    }
  }
  if (props.infiniteScroll && response.collection.length < props.limit) {
    end.value = true;
  }
  requesting.value = false;
}

function updateOrder(property)
{
  if (!requesting.value) {
    order.value = active.value != property || order.value == 'desc' ? 'asc' : 'desc';
    active.value = property;
    requestServer(true);
  }
}

onMounted(async () => {
   await init(true);
   observer = new IntersectionObserver(shiftThenRequestServer, {
    threshold: 1.0
   });
   observer.observe(observered.value);
   if (props.directQuery) {
    requestServer();
  }
});
watch(() => props.model, () => init(true));
watch(() => props.columns, () => init(false));
watch(() => props.filter, () => requestServer(true));
watch(() => props.infiniteScroll, () => requestServer(true));
</script>

<template>
  <div :class="classes.collection" :id="id">
    <div v-if="displayCount || !infiniteScroll || onExport" :class="classes.collection_header">
      <div><div v-if="displayCount">{{ translate('results') }} : {{ count }}</div></div>
      <Pagination v-if="!infiniteScroll" :page="page" :count="Math.max(1, Math.ceil(count/limit))" :lock="requesting" @update="updatePage"/>
      <div><IconButton v-if="onExport" icon="export" @click="() => $emit('export', filter)"/></div>
    </div>
    <div style="position: relative;">
      <slot name="loading" :requesting="requesting">
        <Transition name="qkit-collection-spinner">
          <div v-if="requesting" :class="classes.spinner"></div>
        </Transition>
      </slot>
      <div :class="classes.collection_content">
        <table :class="classes.collection_table">
          <thead>
            <tr>
              <th v-for="computedColumn in computedColumns" :key="computedColumn.id">
                <button v-if="computedColumn.sortable"
                  type="button"
                  :class="classes.btn + ' ' + (active == computedColumn.id ? (classes.active + ' ' + (order == 'asc' ? classes.order_asc : classes.order_desc)) : '')" 
                  @click="() => updateOrder(computedColumn.id)"
                >
                  {{ computedColumn.label }}
                </button>
                <div v-else>
                  {{ computedColumn.label }}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="object in collection" :key="object.id" 
              :class="onRowClick ? classes.collection_clickable_row : ''" 
              @click="(e) => $emit('rowClick', object, e)"
            >
              <td v-for="computedColumn in computedColumns" :key="computedColumn.id">
                <div v-if="computedColumn.component">
                  <component :is="computedColumn.component" :value="object[computedColumn.id]" :row-value="object"/>
                </div>
                <button v-else-if="computedColumn.onCellClick"
                  type="button"
                  :class="classes.collection_clickable_cell"
                  v-html="object[computedColumn.id]"
                  @click="(e) => computedColumn.onCellClick ? computedColumn.onCellClick(object, computedColumn.id, e) : null"
                >
                </button>
                <div :class="classes.collection_cell" v-else v-html="object[computedColumn.id]"></div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-show="infiniteScroll && !end && !requesting" ref="observered" style="height: 1px;"></div>
      </div>
    </div>
  </div>
</template>
