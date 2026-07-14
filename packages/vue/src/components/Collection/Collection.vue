<script setup lang="ts">
import {
  ref,
  reactive,
  watch,
  watchEffect,
  onMounted,
  onUnmounted,
  shallowRef,
  computed,
  toRaw,
  nextTick,
} from 'vue';
import { requester as baseRequester, requestErrorHandler } from '@core/Requester';
import { classes } from '@core/ClassManager';
import { resolve, getPropertyPath, type Property, type EntitySchema } from '@core/EntitySchema';
import { PropertyNotFoundError } from '@core/errors';
import { translate } from '@i18n/i18n';
import { config as globalConfig } from '@config/config';
import { computeFilter } from '@core/computeFilter';
import { deepEqual } from '@core/Utils';
import Icon from '@components/Common/Icon.vue';
import IconButton from '@components/Common/IconButton.vue';
import Pagination from '@components/Pagination/Pagination.vue';
import CollectionTable from '@components/Collection/CollectionTable.vue';
import FieldsEditor from '@components/Collection/FieldsEditor.vue';
import InvalidEntity from '@components/Messages/InvalidEntity.vue';
import InvalidField from '@components/Messages/InvalidField.vue';
import type {
  CustomFieldConfig,
  SortItem,
  CollectionType,
  CollectionContent,
  CollectionConfig,
  Requester,
  RequesterFunction,
  Filter,
} from '@core/types';

interface Props {
  entity: string;
  customFields?: Record<string, CustomFieldConfig>;
  filter?: Filter | null;
  directQuery?: boolean;
  limit?: number;
  onItemClick?: (item: Record<string, unknown>, event: MouseEvent | KeyboardEvent) => void;
  quickSort?: boolean;
  postRequest?: (collection: Record<string, unknown>[]) => void | Promise<void>;
  onRequestError?: (error: unknown) => void;
  allowedCollectionTypes?: CollectionType[];
  displayCount?: boolean;
  onExport?: (filter?: Filter) => void;
  userTimezone?: string;
  requestTimezone?: string;
  editFields?: boolean;
  naturalSortWhenEmpty?: boolean;
  reflow?: boolean;
  manual?: boolean;
  debounce?: number;
  requester?: Requester | RequesterFunction;
  queryBuilderId?: string;
}

interface IndexedSortEntry {
  order: 'asc' | 'desc';
  properties: string[];
}

interface InitScope {
  entity?: boolean;
  fields?: boolean;
  sort?: boolean;
  filter?: boolean;
}

interface Query {
  entity: string;
  fields: string[];
  sort: (string | SortItem)[] | null | undefined;
  filter: Filter | null | undefined;
}

defineExpose({ submit });

const fields = defineModel<string[]>('fields', { required: true });
const sort = defineModel<(string | SortItem)[] | null>('sort');
const page = defineModel<number>('page', { default: 1 });

// undefined: prevent Vue from casting absent boolean props to false
const props = withDefaults(defineProps<Props>(), {
  directQuery: true,
  quickSort: undefined,
  displayCount: undefined,
  editFields: undefined,
  naturalSortWhenEmpty: undefined,
  reflow: undefined,
  manual: undefined,
});

let hasExecFirstQuery = false;
let requestId = 0;
let properties: string[] = [];
let requestTimeoutId: ReturnType<typeof setTimeout> | undefined;
let queue: Promise<unknown> = Promise.resolve();
let lastChildSort: unknown;
let lastChildFields: unknown;

const computedFilter = shallowRef<Filter | undefined>();
const lastValidatedFilter = shallowRef<Filter | undefined>();
const pendingTasks = ref<number>(0);
const requesting = ref<boolean>(false);
const fieldsProperties = shallowRef<Record<string, Property | undefined>>({});
const collectionContent = shallowRef<CollectionContent>({ collection: [], fieldsProperties: {}, replaced: false });
const count = ref<number>(0);
const limit = ref<number | undefined>();
const end = ref<boolean>(false);
const entitySchema = ref<EntitySchema>();
const indexedSort = shallowRef<Record<string, IndexedSortEntry>>({});
const invalidFields = ref<string[]>([]);
const filterError = ref<boolean>(false);
const validEntity = ref<boolean>(true);
const config = reactive<CollectionConfig>({} as CollectionConfig);
const infiniteScroll = ref<boolean>(
  (props.allowedCollectionTypes ?? globalConfig.allowedCollectionTypes)[0] === 'infinite',
);

const autoRequest = computed<boolean>(() => !(props.manual ?? globalConfig.manual));

const activeRequester = computed<Requester | RequesterFunction>(() => {
  const requester = props.requester ?? baseRequester;
  if (!requester) {
    throw new Error('requester is required, either as a prop or registered globally via plugin options');
  }
  return requester;
});


const pageCount = computed(() => (limit.value ? Math.max(1, Math.ceil(count.value / limit.value)) : 0));

const exportedFilter = computed<Filter | undefined>(() =>
  autoRequest.value ? computedFilter.value : lastValidatedFilter.value,
);
// Relies on computeFilter never resolving nullish (no filter -> empty group):
// !exportedFilter means "no successful compute yet", never "empty filter".
const exportDisabled = computed<boolean>(
  () => pendingTasks.value > 0 || filterError.value || !exportedFilter.value,
);

// Synchronous on purpose: window.open/downloads in the consumer's handler
// require the click's transient user activation.
function exportFilter(): void {
  props.onExport!(exportedFilter.value);
}

async function submit(): Promise<void> {
  // Let a same-tick filter edit enqueue its init before requesting.
  await nextTick();
  registerToQueue(async () => {
    // A failed validate keeps the previous committed snapshot (its request is skipped too).
    if (!filterError.value) lastValidatedFilter.value = computedFilter.value;
  });
  reloadCollection();
}

function registerToQueue<T>(task: () => Promise<T>): Promise<T> {
  pendingTasks.value++;
  const run = queue.then(task);
  queue = run.catch(() => undefined).finally(() => pendingTasks.value--);
  return run;
}

// Captured synchronously at the call site, never inside a queued task: each init
// uses the query as of when it was scheduled, not a value re-read after drift.
function snapshotQuery(overrides?: Partial<Query>): Query {
  return { entity: props.entity, fields: fields.value, sort: sort.value, filter: props.filter, ...overrides };
}

async function doInit(scope: InitScope, query: Query): Promise<boolean> {
  const reEntity = scope.entity;
  const reFields = reEntity || scope.fields;
  const reSort = reFields || scope.sort;
  const reFilter = reEntity || scope.filter;

  if (reEntity) {
    try {
      entitySchema.value = await resolve(query.entity);
      validEntity.value = true;
    } catch {
      validEntity.value = false;
      return false;
    }
  } else if (!entitySchema.value) {
    return false;
  }

  if (reFields) await initFields(entitySchema.value!, query.fields);
  if (reSort) await initSort(query.sort, Object.keys(fieldsProperties.value), entitySchema.value!.id, props.customFields);
  const filterChanged = reFilter ? await recomputeFilter(query.filter, query.entity) : false;
  if (reEntity) lastValidatedFilter.value = filterError.value ? undefined : computedFilter.value;

  return reEntity || ((reSort || filterChanged) && autoRequest.value);
}

async function initFields(entitySchema: EntitySchema, cols: string[]): Promise<void> {
  const colsProps: Record<string, Property | undefined> = {};
  properties = [];

  const invalid: string[] = [];
  for (const fieldId of cols) {
    try {
      const customField = props.customFields?.[fieldId];
      const propertyPath = customField?.open ? undefined : await getPropertyPath(entitySchema.id, fieldId);
      const property = propertyPath?.[propertyPath.length - 1];
      colsProps[fieldId] = property;

      if (property) {
        properties.push(fieldId);
      }
      if (customField?.properties?.length) {
        properties.push(...customField.properties);
      }
    } catch (e) {
      if (e instanceof PropertyNotFoundError) {
        invalid.push(fieldId);
      } else {
        throw e;
      }
    }
  }
  properties = [...new Set(properties)];
  invalidFields.value = invalid;
  fieldsProperties.value = colsProps;
}

async function initSort(
  sort: (string | SortItem)[] | null | undefined,
  fields: string[],
  entity: string,
  customFields?: Record<string, CustomFieldConfig>,
): Promise<void> {
  if (!sort) {
    indexedSort.value = {};
    return;
  }
  // These keep/drop rules are mirrored by orderByField in CollectionTable.vue
  // (header arrows) — keep both in sync.
  const indexed: Record<string, IndexedSortEntry> = {};
  for (const value of sort) {
    try {
      const field = typeof value == 'string' ? value : value.field;
      if (!fields.includes(field)) continue;
      const order = typeof value == 'string' ? ('asc' as const) : ((value.order || 'asc') as 'asc' | 'desc');

      let reqProps: string[];
      if (customFields?.[field]?.sort) {
        reqProps = customFields[field].sort!;
      } else {
        // Open custom fields are only sortable through their sort config,
        // even when their id resolves to a schema property
        if (customFields?.[field]?.open) continue;
        const propertyPath = await getPropertyPath(entity, field);
        const property = propertyPath[propertyPath.length - 1];

        if (property.type === 'object' || property.type === 'relationship') {
          const schema = await resolve(property.entity!);
          if (schema.natural_sort?.length) {
            reqProps = schema.natural_sort.map((prop) => field + '.' + prop);
          } else {
            const idProperty = schema.unique_identifier;
            reqProps = [field + '.' + idProperty];
          }
        } else {
          reqProps = [field];
        }
      }
      indexed[field] = { order, properties: reqProps };
    } catch (e) {
      if (!(e instanceof PropertyNotFoundError)) throw e;
    }
  }
  indexedSort.value = indexed;
}

async function recomputeFilter(filter: Filter | null | undefined, entity: string): Promise<boolean> {
  let result: Filter | undefined;
  try {
    result = await computeFilter(filter, entity);
  } catch (error) {
    console.warn('[query-kit] computeFilter failed', error);
    filterError.value = true;
    return false;
  }
  filterError.value = false;
  if (deepEqual(result, computedFilter.value)) return false;
  computedFilter.value = result;
  return true;
}

function queueRequest(): void {
  if (requestTimeoutId) {
    clearTimeout(requestTimeoutId);
    requestTimeoutId = undefined;
  }
  hasExecFirstQuery = true;
  requesting.value = true;
  const currentRequestId = ++requestId;

  // Launched without awaiting: the queue orders requests after pending inits
  // but must not be blocked by the network.
  registerToQueue(async () => void requestServer());

  async function requestServer(): Promise<void> {
    try {
      if (currentRequestId !== requestId) return;
      if (filterError.value || !validEntity.value) return;

      // Pinned in the request's synchronous setup so the collection commits the same properties that were requested.
      const requestFieldsProperties = fieldsProperties.value;

      const requesterValue = activeRequester.value;
      const fetch = typeof requesterValue == 'function' ? requesterValue : requesterValue.request;

      const sortRequest = Object.keys(indexedSort.value).length
        ? Object.values(indexedSort.value).flatMap((entry) =>
            entry.properties.map((prop) => ({ property: prop, order: entry.order })),
          )
        : config.naturalSortWhenEmpty && entitySchema.value?.natural_sort?.length
          ? entitySchema.value.natural_sort.map((property) => ({ property, order: 'asc' }))
          : undefined;

      const response = await fetch({
        entity: props.entity,
        sort: sortRequest,
        page: page.value,
        limit: limit.value,
        filter: computedFilter.value,
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

      const replaced = !infiniteScroll.value || page.value <= 1;
      collectionContent.value = {
        collection: replaced
          ? [...response.collection]
          : [...collectionContent.value.collection, ...response.collection],
        fieldsProperties: requestFieldsProperties,
        replaced,
      };

      if (infiniteScroll.value && response.collection.length < limit.value!) {
        end.value = true;
      }
    } catch (error) {
      (props.onRequestError ?? requestErrorHandler)?.(error);
    } finally {
      if (currentRequestId === requestId) {
        requesting.value = false;
      }
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

function reloadCollection(debounce = false): void {
  if (requestTimeoutId) clearTimeout(requestTimeoutId);
  requestTimeoutId = undefined;

  const run = () => {
    end.value = false;
    if (page.value === 1) queueRequest();
    else page.value = 1;
  };

  const delay = debounce ? props.debounce ?? globalConfig.debounce : 0;
  delay ? (requestTimeoutId = setTimeout(run, delay)) : run();
}

async function onChildSort(value: (string | SortItem)[] | null | undefined): Promise<void> {
  lastChildSort = toRaw(value);
  sort.value = value;
  const query = snapshotQuery({ sort: value });
  await registerToQueue(() => doInit({ sort: true }, query));
  reloadCollection();
}

async function onChildFields(value: string[]): Promise<void> {
  lastChildFields = toRaw(value);
  fields.value = value;
  const query = snapshotQuery({ fields: value });
  await registerToQueue(() => doInit({ fields: true }, query));
  reloadCollection();
}

function onReachedEnd(): void {
  if (infiniteScroll.value && !end.value && !requesting.value && !requestTimeoutId && hasExecFirstQuery) {
    page.value++;
  }
}

onMounted(async () => {
  const query = snapshotQuery();
  await registerToQueue(() => doInit({ entity: true }, query));
  collectionContent.value = { collection: [], fieldsProperties: fieldsProperties.value, replaced: false };
  if (props.directQuery) {
    queueRequest();
  }
});

onUnmounted(() => {
  if (requestTimeoutId) clearTimeout(requestTimeoutId);
});

// Must be before the other watches: config must be populated before isInfiniteAccordingConfig runs
watchEffect(() => {
  config.userTimezone = props.userTimezone ?? globalConfig.userTimezone;
  config.requestTimezone = props.requestTimezone ?? globalConfig.requestTimezone;
  config.quickSort = props.quickSort ?? globalConfig.quickSort;
  config.displayCount = props.displayCount ?? globalConfig.displayCount;
  config.editFields = props.editFields ?? false;
  config.naturalSortWhenEmpty = props.naturalSortWhenEmpty ?? globalConfig.naturalSortWhenEmpty;
  config.allowedCollectionTypes = props.allowedCollectionTypes ?? globalConfig.allowedCollectionTypes;
  config.reflow = props.reflow ?? globalConfig.reflow;
});
watchEffect(() => {
  limit.value = props.limit ?? globalConfig.limit;
});

watch(
  [() => props.entity, () => props.filter, sort, fields],
  async ([newEntity, newFilter, newSort, newFields], [oldEntity, oldFilter, oldSort, oldFields]) => {
    const scope: InitScope = {};
    if (newEntity !== oldEntity) scope.entity = true;
    if (newFilter !== oldFilter) scope.filter = true;
    if (newSort !== oldSort && toRaw(newSort) !== lastChildSort) scope.sort = true;
    if (newFields !== oldFields && toRaw(newFields) !== lastChildFields) scope.fields = true;
    lastChildSort = undefined;
    lastChildFields = undefined;
    if (!Object.keys(scope).length) return;

    const query = snapshotQuery();
    const shouldReload = await registerToQueue(() => doInit(scope, query));
    if (shouldReload) reloadCollection(!scope.entity);
  },
);
watch(infiniteScroll, () => reloadCollection());
watch(page, queueRequest);
watch(
  () => config.allowedCollectionTypes,
  () => (infiniteScroll.value = isInfiniteAccordingConfig()),
  { immediate: true },
);
</script>

<template>
  <section :class="classes.collection" :aria-label="translate('collection')" :data-qkit-reflow="config.reflow || undefined">
    <a v-if="queryBuilderId" :href="'#' + queryBuilderId" :class="classes.skip_link">
      {{ translate('go_to_query_builder') }}
    </a>
    <InvalidEntity v-if="!validEntity" :entity="entity" />
    <template v-else>
      <div>
        <div
          v-if="
            config.displayCount ||
            !infiniteScroll ||
            onExport ||
            config.allowedCollectionTypes.length > 1 ||
            config.editFields
          "
          :class="classes.collection_header"
        >
          <div>
            <div v-if="config.displayCount">{{ translate('results') }} : {{ count }}</div>
          </div>
          <Pagination v-if="!infiniteScroll && pageCount" v-model="page" :count="pageCount" :lock="requesting" />
          <div :class="classes.collection_actions">
            <IconButton v-if="onExport" icon="export" :disabled="exportDisabled" @click="exportFilter" />
            <IconButton
              v-if="config.allowedCollectionTypes.length > 1"
              :icon="infiniteScroll ? 'paginated_list' : 'infinite_list'"
              @click="() => (infiniteScroll = !infiniteScroll)"
            />
            <FieldsEditor
              v-if="config.editFields && entitySchema"
              :model-value="fields"
              :custom-fields="customFields"
              :entity-schema="entitySchema"
              @update:model-value="onChildFields"
            />
          </div>
        </div>
      </div>
      <div v-if="invalidFields.length" :class="classes.error_message_bag">
        <InvalidField v-for="fieldId in invalidFields" :key="fieldId" :field="fieldId" />
      </div>
      <Transition name="qkit-collection-loading">
        <div v-if="requesting" :class="classes.loading" :position="infiniteScroll && page > 1 ? 'bottom' : 'top'">
          <Icon icon="loading" />
        </div>
      </Transition>
      <div :class="classes.collection_content">
        <div v-if="filterError" :class="classes.error_message_bag">{{ translate('invalid_filter') }}</div>
        <CollectionTable
          v-else-if="entitySchema"
          :content="collectionContent"
          :custom-fields="customFields"
          :sort="sort"
          :entity-schema="entitySchema"
          :user-timezone="config.userTimezone"
          :request-timezone="config.requestTimezone"
          :reflow="config.reflow"
          :on-row-click="onItemClick"
          @reached-end="onReachedEnd"
          @update:sort="onChildSort"
        />
      </div>
    </template>
  </section>
</template>
