<script setup lang="ts">
import { ref, watch, watchEffect, computed, type Component } from 'vue';
import { resolve, getPropertyTranslation, type EntitySchema, type Property } from '@core/EntitySchema';
import Group from '@components/Filter/Group.vue';
import Condition from '@components/Filter/Condition.vue';
import Scope from '@components/Filter/Scope.vue';
import RelationshipQueueElement from '@components/Filter/RelationshipQueueElement.vue';
import { isValidOperator, type AllowedOperators, type ComputedScopes } from '@core/OperatorManager';
import InvalidEntity from '@components/Messages/InvalidEntity.vue';
import InvalidProperty from '@components/Messages/InvalidProperty.vue';
import InvalidOperator from '@components/Messages/InvalidOperator.vue';
import IconButton from '@components/Common/IconButton.vue';
import RelationshipAction from '@components/Filter/RelationshipAction.vue';
import { getUniqueId } from '@core/Utils';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import type {
  RelationshipConditionFilter,
  Filter,
  DisplayOperator,
  AllowedScopes,
  AllowedProperties,
  ConditionFilter,
  ScopeFilter,
  GroupFilter,
} from '@core/types';

interface QueueElement {
  key: string | number;
  value: RelationshipConditionFilter;
  schema: EntitySchema;
}

interface Props {
  modelValue: RelationshipConditionFilter;
  entity: string;
  computedScopes?: ComputedScopes;
  allowedScopes?: AllowedScopes;
  allowedProperties?: AllowedProperties;
  allowedOperators?: AllowedOperators;
  displayOperator?: DisplayOperator;
  userTimezone?: string;
  requestTimezone?: string;
}

interface Emits {
  remove: [];
  goToRootGroup: [];
}

const emit = defineEmits<Emits>();
const props = withDefaults(defineProps<Props>(), {
  displayOperator: true,
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
});

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

const endQueuePropertySchemaId = computed<string>(() => {
  if (!queue.value?.length) throw new Error('should not be called when queue is empty');
  const lastQueueElement = queue.value[queue.value.length - 1];
  const lastQueueSchema = lastQueueElement.schema;
  return lastQueueSchema.mapProperties[lastQueueElement.value.property].related!;
});

const endQueueComponent = computed<Component | null>(() => {
  switch (endQueueFilter.value?.type) {
    case 'condition':
      return Condition;
    case 'scope':
      return Scope;
    case 'group':
      return Group;
    default:
      return null;
  }
});

async function initSchema(): Promise<void> {
  try {
    setChild(await resolve(props.entity));
  } catch {
    invalidEntity.value = props.entity;
  }
}

async function addFilter(filter: Filter): Promise<void> {
  if (!queue.value?.length) throw new Error('should not be called when queue is empty');
  const endQueuePropertySchema = await resolve(endQueuePropertySchemaId.value);

  queue.value[queue.value.length - 1].value.filter = filter;
  if (filter.type == 'relationship_condition') {
    queue.value.push({
      key: getUniqueId(),
      value: filter,
      schema: endQueuePropertySchema,
    });
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

  queue.value[queue.value.length - 1].value.filter = undefined;
  endQueueFilter.value = null;
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
    const operator =
      typeof childFilter.operator == 'string' ? childFilter.operator.toLowerCase() : childFilter.operator;
    if (!isValidOperator('relationship_condition', operator)) {
      invalidOperator.value = childFilter.operator;
      return;
    }
    if (!childSchema.mapProperties[childFilter.property]) {
      invalidProperty.value = childFilter.property;
      return;
    }
    childAriaLabelProperty.value = childSchema.mapProperties[childFilter.property];

    const property = childSchema.mapProperties[childFilter.property];
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
}

watchEffect(initSchema);
watch(() => props.modelValue.filter, initSchema);
</script>

<template>
  <div
    v-if="invalidEntity || invalidProperty || invalidOperator"
    :class="classes.condition_error_container"
    tabindex="0"
    :aria-label="translate('relationship_condition')"
  >
    <div>
      <InvalidEntity v-if="invalidEntity" :entity="invalidEntity" />
      <InvalidProperty v-else-if="invalidProperty" :property="invalidProperty" />
      <InvalidOperator v-else-if="invalidOperator" :operator="invalidOperator" />
    </div>
    <IconButton icon="delete" btn-class="btn_secondary" @click="$emit('remove')" />
  </div>
  <template v-else-if="queue">
    <Transition name="qkit-collapse-horizontal-list" mode="out-in">
      <div v-if="!endQueueFilter" :class="classes.grid_container_for_transition">
        <div :class="classes.relationship_container" tabindex="0" :aria-label="translate('relationship_condition')">
          <div :class="classes.relationship_queue_and_action">
            <slot name="shortcuts" />
            <div :class="classes.relationship_queue">
              <RelationshipQueueElement
                v-for="elmnt in queue"
                :key="elmnt.key"
                v-bind="props"
                :model-value="elmnt.value"
                :entity="elmnt.schema.id"
              />
            </div>
            <RelationshipAction
              v-bind="props"
              :entity="endQueuePropertySchemaId"
              :model-value="queue[queue.length - 1].value"
              @remove="removeQueueFilter"
              @add="addFilter"
            />
          </div>
          <IconButton
            v-if="!(queue[queue.length - 1].value.removable === false)"
            icon="delete"
            btn-class="btn_secondary"
            :aria-label="translate('condition') + ' ' + childAriaLabel"
            @click="$emit('remove')"
          />
        </div>
      </div>
      <div v-else :class="classes.grid_container_for_transition">
        <component
          :is="endQueueComponent"
          v-bind="props"
          :entity="endQueuePropertySchemaId"
          :model-value="endQueueFilter"
          @remove="removeEndFilter"
          v-on="endQueueFilter.type == 'group' ? { goToRootGroup: () => $emit('goToRootGroup') } : {}"
        >
          <template #relationship>
            <div :class="classes.relationship_queue">
              <RelationshipQueueElement
                v-for="elmnt in queue"
                :key="elmnt.key"
                v-bind="props"
                :model-value="elmnt.value"
                :entity="elmnt.schema.id"
              />
            </div>
          </template>
          <template #shortcuts="shortcutsProps">
            <slot name="shortcuts" v-bind="shortcutsProps" />
          </template>
        </component>
      </div>
    </Transition>
  </template>
</template>
