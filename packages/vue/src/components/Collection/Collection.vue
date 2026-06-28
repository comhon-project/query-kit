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
import FieldsEditor from '@components/Collection/FieldsEditor.vue';
import InvalidField from '@components/Messages/InvalidField.vue';
import type {
  CustomFieldConfig,
  SortItem,
  CollectionType,
  CollectionConfig,
  Requester,
  RequesterFunction,
  Filter,
} from '@core/types';

interface Props {
  entity: string;
  customFields?: Record<string, CustomFieldConfig>;
  filter?: Filter;
  directQuery?: boolean;
  limit?: number;
  onItemClick?: (item: Record<string, unknown>, event: MouseEvent | KeyboardEvent) => void;
  quickSort?: boolean;
  postRequest?: (collection: Record<string, unknown>[]) => void | Promise<void>;
  allowedCollectionTypes?: CollectionType[];
  displayCount?: boolean;
  onExport?: (filter?: Filter) => void;
  userTimezone?: string;
  requestTimezone?: string;
  editFields?: boolean;
  naturalSortWhenEmpty?: boolean;
  requester?: Requester | RequesterFunction;
  queryBuilderId?: string;
}

interface IndexedSortEntry {
  order: 'asc' | 'desc';
  properties: string[];
}
const fields = defineModel<string[]>('fields', { required: true });
const sort = defineModel<(string | SortItem)[]>('sort');
const page = defineModel<number>('page', { default: 1 });

// undefined: prevent Vue from casting absent boolean props to false
const props = withDefaults(defineProps<Props>(), {
  directQuery: true,
  quickSort: undefined,
  displayCount: undefined,
  editFields: undefined,
  naturalSortWhenEmpty: undefined,
});

let hasExecFirstQuery = false;
let requestId = 0;
let properties: string[] = [];
const requesting = ref<boolean>(false);
const fieldsProperties = shallowRef<Record<string, Property | undefined>>({});
const collection = shallowReactive<Record<string, unknown>[]>([]);
const count = ref<number>(0);
const limit = ref<number | undefined>();
const end = ref<boolean>(false);
const collectionContent = useTemplateRef<HTMLDivElement>('collectionContent');
const entitySchema = ref<EntitySchema>();
const rowKeyProperty = ref<string>();
const indexedSort = shallowRef<Record<string, IndexedSortEntry>>({});
const invalidFields = ref<string[]>([]);
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

const displayedFields = computed<string[]>(() => Object.keys(fieldsProperties.value));

const showInfiniteScrollObserver = computed(() => {
  return infiniteScroll.value && !end.value && !requesting.value && hasExecFirstQuery;
});

const pageCount = computed(() => (limit.value ? Math.max(1, Math.ceil(count.value / limit.value)) : 0));

const rowEvents = (row: Record<string, unknown>) =>
  props.onItemClick
    ? {
        click: (e: MouseEvent) => props.onItemClick!(row, e),
        keydown: (e: KeyboardEvent) => {
          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            props.onItemClick!(row, e);
          }
        },
      }
    : {};

async function init(): Promise<void> {
  entitySchema.value = await resolve(props.entity);
  await initFields(entitySchema.value);
  await initSort(sort.value, displayedFields.value, entitySchema.value!.id, props.customFields);
}

async function initFields(entitySchema: EntitySchema): Promise<void> {
  const cols = fields.value;
  rowKeyProperty.value = entitySchema.unique_identifier;
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
  sort: (string | SortItem)[] | undefined,
  fields: string[],
  entity: string,
  customFields?: Record<string, CustomFieldConfig>,
): Promise<void> {
  if (!sort) {
    indexedSort.value = {};
    return;
  }
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

function nextOrder(current: 'asc' | 'desc' | undefined): 'asc' | 'desc' | undefined {
  if (!current) return 'asc';
  if (current === 'asc') return 'desc';
  return undefined;
}

function updateSort(fieldId: string | undefined, multi: boolean): void {
  if (!fieldId) {
    return;
  }
  const currentOrder = indexedSort.value[fieldId]?.order;
  const newOrder = nextOrder(currentOrder);
  if (multi) {
    const updated: SortItem[] = Object.entries(indexedSort.value).map(([col, entry]) => ({
      field: col,
      order: entry.order,
    }));
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
    sort.value = updated;
  } else {
    sort.value = newOrder ? [{ field: fieldId, order: newOrder }] : [];
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
      : config.naturalSortWhenEmpty && entitySchema.value?.natural_sort?.length
        ? entitySchema.value.natural_sort.map((property) => ({ property, order: 'asc' }))
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
  config.editFields = props.editFields ?? globalConfig.editFields;
  config.naturalSortWhenEmpty = props.naturalSortWhenEmpty ?? globalConfig.naturalSortWhenEmpty;
  config.allowedCollectionTypes = props.allowedCollectionTypes ?? globalConfig.allowedCollectionTypes;
});
watchEffect(() => {
  limit.value = props.limit ?? globalConfig.limit;
});
watch([() => props.entity, fields, sort], async (newVals, oldVals) => {
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
    <a v-if="queryBuilderId" :href="'#' + queryBuilderId" :class="classes.skip_link">
      {{ translate('go_to_query_builder') }}
    </a>
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
          <IconButton v-if="onExport" icon="export" @click="() => onExport!(filter)" />
          <IconButton
            v-if="config.allowedCollectionTypes.length > 1"
            :icon="infiniteScroll ? 'paginated_list' : 'infinite_list'"
            @click="() => (infiniteScroll = !infiniteScroll)"
          />
          <FieldsEditor
            v-if="config.editFields && entitySchema"
            v-model="fields"
            :custom-fields="customFields"
            :entity-schema="entitySchema"
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
    <div ref="collectionContent" :class="classes.collection_content">
      <table :class="classes.collection_table">
        <caption :class="classes.sr_only">{{ translate('results') }}</caption>
        <thead>
          <tr>
            <Header
              v-for="fieldId in displayedFields"
              :key="fieldId"
              :entity-schema="entitySchema!"
              :field-id="fieldId"
              :open="customFields?.[fieldId]?.open === true"
              :label="customFields?.[fieldId]?.label"
              :order="indexedSort[fieldId]?.order"
              :has-custom-sort="customFields?.[fieldId]?.sort != null"
              @click="updateSort"
            />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(object, rowIndex) in collection"
            :key="(object[rowKeyProperty!] as string | number) ?? rowIndex"
            :class="onItemClick ? classes.collection_clickable_row : ''"
            :tabindex="onItemClick ? 0 : undefined"
            v-on="rowEvents(object)"
          >
            <template v-for="fieldId in displayedFields" :key="fieldId">
              <Cell
                :field-id="fieldId"
                :property="fieldsProperties[fieldId]"
                :row-value="object"
                :renderer="customFields?.[fieldId]?.renderer"
                :user-timezone="config.userTimezone"
                :request-timezone="config.requestTimezone"
                @click="customFields?.[fieldId]?.onFieldClick"
              />
            </template>
          </tr>
          <tr v-show="showInfiniteScrollObserver" ref="observered" style="opacity: 0">
            <td :colspan="displayedFields.length"></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
