<script setup lang="ts">
import { ref, watch, computed, type Component } from 'vue';
import { resolve, getPropertyTranslation, type EntitySchema, type Property } from '@core/EntitySchema';
import ChildGroup from '@components/Filter/ChildGroup.vue';
import Condition from '@components/Filter/Condition.vue';
import Scope from '@components/Filter/Scope.vue';
import RelationshipQueueElement from '@components/Filter/RelationshipQueueElement.vue';
import { isValidOperator } from '@core/OperatorManager';
import InvalidEntity from '@components/Messages/InvalidEntity.vue';
import InvalidProperty from '@components/Messages/InvalidProperty.vue';
import InvalidOperator from '@components/Messages/InvalidOperator.vue';
import IconButton from '@components/Common/IconButton.vue';
import RelationshipAction from '@components/Filter/RelationshipAction.vue';
import { getUniqueId } from '@core/Utils';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import type { RelationshipConditionFilter, Filter, ConditionFilter, ScopeFilter, GroupFilter } from '@core/types';

interface QueueElement {
  key: string | number;
  value: RelationshipConditionFilter;
  schema: EntitySchema;
}

interface Props {
  modelValue: RelationshipConditionFilter;
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

const endQueuePropertySchemaId = computed<string>(() => {
  if (!queue.value?.length) throw new Error('should not be called when queue is empty');
  const lastQueueElement = queue.value[queue.value.length - 1];
  const lastQueueSchema = lastQueueElement.schema;
  return lastQueueSchema.getProperty(lastQueueElement.value.property).related!;
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
  const resolvedSchema = await resolve(endQueuePropertySchemaId.value);

  queue.value[queue.value.length - 1].value.filter = filter;
  if (filter.type == 'relationship_condition') {
    queue.value.push({
      key: getUniqueId(),
      value: filter,
      schema: resolvedSchema,
    });
    endQueuePropertySchema.value = await resolve(
      resolvedSchema.getProperty(filter.property).related!,
    );
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
  while (childFilter?.type == 'relationship_condition') {
    tempQueue.push({
      key: getUniqueId(),
      value: childFilter,
      schema: childSchema,
    });
    if (!isValidOperator('relationship_condition', childFilter.operator)) {
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

    if (property.relationship_type == 'morph_to') {
      throw new Error('not handle morph_to relationship');
    }

    const childSchemaId = property.related!;
    try {
      childSchema = await resolve(childSchemaId);
    } catch {
      invalidEntity.value = childSchemaId;
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
  <div v-if="invalidEntity || invalidProperty || invalidOperator" :class="classes.condition_error_container">
    <div>
      <InvalidEntity v-if="invalidEntity" :entity="invalidEntity" />
      <InvalidProperty v-else-if="invalidProperty" :property="invalidProperty" />
      <InvalidOperator v-else-if="invalidOperator" :operator="invalidOperator" />
    </div>
    <IconButton icon="delete" btn-class="btn_danger" @click="$emit('remove')" />
  </div>
  <template v-else-if="queue">
    <Transition name="qkit-collapse-horizontal-list" mode="out-in">
      <div v-if="!endQueueFilter" :class="classes.grid_container_for_transition">
        <div :class="classes.relationship_container">
          <div :class="classes.relationship_queue_and_action">
            <div :class="classes.relationship_queue">
              <RelationshipQueueElement
                v-for="elmnt in queue"
                :key="elmnt.key"
                :model-value="elmnt.value"
                :entity-schema="elmnt.schema"
              />
            </div>
            <RelationshipAction
              v-if="endQueuePropertySchema"
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
      </div>
      <div v-else :class="classes.grid_container_for_transition">
        <component
          :is="endQueueComponent"
          :entity-schema="endQueuePropertySchema"
          :model-value="endQueueFilter"
          v-model:collapsed="collapsed"
          @remove="removeEndFilter"
        >
          <template #relationship>
            <div :class="classes.relationship_queue">
              <RelationshipQueueElement
                v-for="elmnt in queue"
                :key="elmnt.key"
                :model-value="elmnt.value"
                :entity-schema="elmnt.schema"
              />
            </div>
          </template>
        </component>
      </div>
    </Transition>
  </template>
</template>
