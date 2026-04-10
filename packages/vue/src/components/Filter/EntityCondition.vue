<script setup lang="ts">
import { ref, watch, computed, type Component } from 'vue';
import { resolve, resolveIntersection, getPropertyTranslation, type EntitySchema, type Property } from '@core/EntitySchema';
import ChildGroup from '@components/Filter/ChildGroup.vue';
import Condition from '@components/Filter/Condition.vue';
import Scope from '@components/Filter/Scope.vue';
import EntityQueueElement from '@components/Filter/EntityQueueElement.vue';
import { isValidOperator } from '@core/OperatorManager';
import InvalidEntity from '@components/Messages/InvalidEntity.vue';
import InvalidProperty from '@components/Messages/InvalidProperty.vue';
import InvalidOperator from '@components/Messages/InvalidOperator.vue';
import IconButton from '@components/Common/IconButton.vue';
import EntityAction from '@components/Filter/EntityAction.vue';
import { getUniqueId } from '@core/Utils';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import type { EntityConditionFilter, Filter, ConditionFilter, ScopeFilter, GroupFilter } from '@core/types';

interface QueueElement {
  key: string | number;
  value: EntityConditionFilter;
  schema: EntitySchema;
}

interface Props {
  modelValue: EntityConditionFilter;
  entitySchema: EntitySchema;
}

interface Emits {
  remove: [];
}

const emit = defineEmits<Emits>();
const collapsed = defineModel<boolean>('collapsed', { default: false });
const props = defineProps<Props>();

const invalidEntity = ref<string | null>(null);
const invalidProperty = ref<string | null>(null);
const invalidOperator = ref<string | null>(null);
const childAriaLabelProperty = ref<Property | null>(null);
const childAriaLabel = computed<string>(() => {
  if (!childAriaLabelProperty.value) return '';
  return getPropertyTranslation(childAriaLabelProperty.value);
});
const queue = ref<QueueElement[] | null>(null);
const endQueueFilter = ref<ConditionFilter | ScopeFilter | GroupFilter | null | undefined>(null);
const endQueuePropertySchema = ref<EntitySchema | null>(null);

function resolveEndQueueSchema(): Promise<EntitySchema> {
  if (!queue.value?.length) throw new Error('should not be called when queue is empty');
  const lastQueueElement = queue.value[queue.value.length - 1];
  const entities = lastQueueElement.value.entities;
  if (entities?.length) {
    return resolveIntersection(entities);
  }
  const lastQueueSchema = lastQueueElement.schema;
  const property = lastQueueSchema.getProperty(lastQueueElement.value.property);
  return resolve(property.entity!);
}

const canAddFilter = computed<boolean>(() => {
  if (!queue.value?.length) return false;
  const lastElement = queue.value[queue.value.length - 1];
  const property = lastElement.schema.getProperty(lastElement.value.property);
  return !(property.type === 'object' && lastElement.value.operator === 'has_not');
});

const endQueueComponent = computed<Component | null>(() => {
  switch (endQueueFilter.value?.type) {
    case 'condition':
      return Condition;
    case 'scope':
      return Scope;
    case 'group':
      return ChildGroup;
    default:
      return null;
  }
});

async function addFilter(filter: Filter): Promise<void> {
  if (!queue.value?.length) throw new Error('should not be called when queue is empty');
  const resolvedSchema = await resolveEndQueueSchema();

  queue.value[queue.value.length - 1].value.filter = filter;
  if (filter.type == 'entity_condition') {
    queue.value.push({
      key: getUniqueId(),
      value: filter,
      schema: resolvedSchema,
    });
    const addedProperty = resolvedSchema.getProperty(filter.property);
    endQueuePropertySchema.value = addedProperty.relationship_type === 'morph_to'
      ? (filter.entities?.length ? await resolveIntersection(filter.entities) : null)
      : await resolve(addedProperty.entity!);
  } else {
    endQueueFilter.value = filter;
  }
}

function removeQueueFilter(): void {
  if (!queue.value) return;
  queue.value.pop();
  if (queue.value.length) {
    removeEndFilter();
  } else {
    emit('remove');
  }
}

function removeEndFilter(): void {
  if (!queue.value?.length) throw new Error('should not be called when queue is empty');

  const treeitem = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('[role="treeitem"]');

  queue.value[queue.value.length - 1].value.filter = undefined;
  endQueueFilter.value = null;

  treeitem?.focus();
}

async function setChild(schema: EntitySchema): Promise<void> {
  let childSchema = schema;
  let childFilter: Filter | undefined | null = props.modelValue;
  const tempQueue: QueueElement[] = [];
  while (childFilter?.type == 'entity_condition') {
    tempQueue.push({
      key: getUniqueId(),
      value: childFilter,
      schema: childSchema,
    });
    if (!isValidOperator('entity_condition', childFilter.operator)) {
      invalidOperator.value = childFilter.operator;
      return;
    }
    let property;
    try {
      property = childSchema.getProperty(childFilter.property);
    } catch {
      invalidProperty.value = childFilter.property;
      return;
    }
    childAriaLabelProperty.value = property;

    const isMorphToWithoutEntities = property.relationship_type === 'morph_to'
      && (!childFilter.entities?.length || !property.entities?.length);
    if (isMorphToWithoutEntities) {
      childFilter.filter = undefined;
      queue.value = tempQueue;
      endQueueFilter.value = null;
      endQueuePropertySchema.value = null;
      return;
    }

    try {
      childSchema = property.relationship_type === 'morph_to'
        ? await resolveIntersection(childFilter.entities!)
        : await resolve(property.entity!);
    } catch {
      invalidEntity.value = property.entity ?? childFilter.entities?.join(', ')!;
      return;
    }
    childFilter = childFilter.filter;
  }
  queue.value = tempQueue;
  endQueueFilter.value = childFilter;
  endQueuePropertySchema.value = childSchema;
}

watch([() => props.entitySchema, () => props.modelValue.filter], () => setChild(props.entitySchema), {
  immediate: true,
});
</script>

<template>
  <div v-if="invalidEntity || invalidProperty || invalidOperator" :class="classes.invalid_filter">
    <div>
      <InvalidEntity v-if="invalidEntity" :entity="invalidEntity" />
      <InvalidProperty v-else-if="invalidProperty" :property="invalidProperty" />
      <InvalidOperator v-else-if="invalidOperator" :operator="invalidOperator" />
    </div>
    <IconButton icon="delete" btn-class="btn_danger" @click="$emit('remove')" />
  </div>
  <template v-else-if="queue">
    <Transition name="qkit-collapse-horizontal-list" mode="out-in">
      <div v-if="!endQueueFilter" :class="classes.entity_condition_container">
        <div>
          <ol :class="classes.entity_condition_queue">
            <EntityQueueElement
              v-for="elmnt in queue"
              :key="elmnt.key"
              :model-value="elmnt.value"
              :entity-schema="elmnt.schema"
              @truncate="setChild(props.entitySchema)"
            />
          </ol>
          <EntityAction
            v-if="endQueuePropertySchema && canAddFilter"
            :entity-schema="endQueuePropertySchema"
            :model-value="queue[queue.length - 1].value"
            @remove="removeQueueFilter"
            @add="addFilter"
          />
        </div>
        <IconButton
          v-if="!(queue[queue.length - 1].value.removable === false)"
          icon="delete"
          btn-class="btn_danger"
          :aria-label="translate('condition') + ' ' + childAriaLabel"
          @click="$emit('remove')"
        />
      </div>
      <component
        v-else
        :is="endQueueComponent"
        :entity-schema="endQueuePropertySchema"
        :model-value="endQueueFilter"
        v-model:collapsed="collapsed"
        @remove="removeEndFilter"
      >
        <template #entity-queue>
          <ol :class="classes.entity_condition_queue">
            <EntityQueueElement
              v-for="elmnt in queue"
              :key="elmnt.key"
              :model-value="elmnt.value"
              :entity-schema="elmnt.schema"
              @truncate="setChild(props.entitySchema)"
            />
          </ol>
        </template>
      </component>
    </Transition>
  </template>
</template>
