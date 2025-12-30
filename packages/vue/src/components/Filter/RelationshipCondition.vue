<script setup>
import { ref, watch, watchEffect, computed } from 'vue';
import { resolve, getPropertyTranslation } from '@core/Schema';
import Group from '@components/Filter/Group.vue';
import Condition from '@components/Filter/Condition.vue';
import RelationshipQueueElement from '@components/Filter/RelationshipQueueElement.vue';
import { isValidOperator } from '@core/OperatorManager';
import InvalidModel from '@components/Messages/InvalidModel.vue';
import InvalidProperty from '@components/Messages/InvalidProperty.vue';
import InvalidOperator from '@components/Messages/InvalidOperator.vue';
import IconButton from '@components/Common/IconButton.vue';
import RelationshipAction from '@components/Filter/RelationshipAction.vue';
import Utils from '@core/Utils';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';

const emit = defineEmits(['remove', 'goToRootGroup', 'transitionGroup']);
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  computedScopes: {
    type: Object, // {modelname: [{id: 'scope_one', name: 'scope one', type: 'string', useOperator: true, computed: () => {...})}, ...], ...}
    default: undefined,
  },
  allowedScopes: {
    type: Object, // {modelname: ['scope_one', 'scope_two', ...], ...}
    default: undefined,
  },
  allowedProperties: {
    type: Object, // {modelname: ['property_name_one', 'property_name_two', ...], ...}
    default: undefined,
  },
  allowedOperators: {
    type: Object, // {condition: ['=', '<>', ...], group: ['AND', 'OR'], relationship_condition: ['HAS', 'HAS_NOT']}
    default: undefined,
  },
  displayOperator: {
    type: [Boolean, Object],
    default: true,
  },
  userTimezone: {
    type: String,
    default: 'UTC',
  },
  requestTimezone: {
    type: String,
    default: 'UTC',
  },
  // not used, just permit to avoid warning when parent component pass ariaLabel prop
  ariaLabel: {
    type: String,
    default: undefined,
  },
  root: {
    // not used, just permit to avoid warning when parent component pass ariaLabel prop
    type: Boolean,
  },
  filter: {
    // not used, just permit to avoid warning when parent component pass ariaLabel prop
    type: Object,
    default: undefined,
  },
  exceptAddFilterToParentGroup: {
    // not used, just permit to avoid warning when parent component pass ariaLabel prop
    type: Boolean,
  },
  exceptGoToPrevious: {
    // not used, just permit to avoid warning when parent component pass ariaLabel prop
    type: Boolean,
  },
  exceptGoToNext: {
    // not used, just permit to avoid warning when parent component pass ariaLabel prop
    type: Boolean,
  },
});

let schema = null;
const invalidModel = ref(null);
const invalidProperty = ref(null);
const invalidOperator = ref(null);
const childAriaLabelProperty = ref(null);
const childAriaLabel = computed(() => {
  if (!childAriaLabelProperty.value) return '';
  return getPropertyTranslation(childAriaLabelProperty.value);
});
const queue = ref(null);
const endQueueFilter = ref(null);

const endQueuePropertyModel = computed(() => {
  const lastQueueElement = queue.value[queue.value.length - 1];
  const lastQueueSchema = lastQueueElement.schema;
  return lastQueueSchema.mapProperties[lastQueueElement.value.property].model;
});

async function initSchema() {
  schema = await resolve(props.model);
  if (!schema) {
    invalidModel.value = props.model;
    return;
  }
  setChild();
}

async function addFilter(filter) {
  const endQueuePropertySchema = await resolve(endQueuePropertyModel.value);

  /**
   * polyfill for browser that don't support css pseudo-class :has() like firefox.
   * remove following emit value when all browser support :has().
   * remove it from list of defined emits too.
   */
  if (filter.type == 'group') {
    emit('transitionGroup');
  }
  queue.value[queue.value.length - 1].value.filter = filter;
  if (filter.type == 'relationship_condition') {
    queue.value.push({
      key: Utils.getUniqueId(),
      value: filter,
      schema: endQueuePropertySchema,
    });
  } else {
    endQueueFilter.value = filter;
  }
}

function removeQueueFilter() {
  queue.value.pop();
  if (queue.value.length) {
    removeEndFilter();
  } else {
    emit('remove');
  }
}

function removeEndFilter() {
  /**
   * polyfill for browser that don't support css pseudo-class :has() like firefox.
   * remove following emit value when all browser support :has().
   * remove it from list of defined emits too.
   */
  if (queue.value[queue.value.length - 1].value.filter.type == 'group') {
    emit('transitionGroup');
  }
  queue.value[queue.value.length - 1].value.filter = null;
  endQueueFilter.value = null;
}

async function setChild() {
  let childSchema = schema;
  let childFilter = props.modelValue;
  let tempQueue = [];
  while (childFilter && childFilter.type == 'relationship_condition') {
    tempQueue.push({
      key: Utils.getUniqueId(),
      value: childFilter,
      schema: childSchema,
    });
    const operator =
      typeof childFilter.operator == 'string' ? childFilter.operator.toLowerCase() : childFilter.operator;
    if (!isValidOperator('relationship_condition', operator)) {
      invalidOperator.value = childFilter.operator;
      childFilter = null;
      return;
    }
    if (!childSchema.mapProperties[childFilter.property]) {
      invalidProperty.value = childFilter.property;
      childFilter = null;
      return;
    }
    childAriaLabelProperty.value = childSchema.mapProperties[childFilter.property];

    const childModelName = childSchema.mapProperties[childFilter.property].model;
    childSchema = await resolve(childModelName);
    if (!childSchema) {
      invalidModel.value = childModelName;
      childFilter = null;
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
    v-if="invalidModel || invalidProperty || invalidOperator"
    :class="classes.condition_error_container"
    tabindex="0"
    :aria-label="translate('relationship_condition')"
  >
    <div>
      <InvalidModel v-if="invalidModel" :model="invalidModel" />
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
                :model="elmnt.schema.name"
              />
            </div>
            <RelationshipAction
              v-bind="props"
              :model="endQueuePropertyModel"
              :model-value="queue[queue.length - 1].value"
              @remove="removeQueueFilter"
              @add="addFilter"
            />
          </div>
          <IconButton
            v-if="!(queue[queue.length - 1].value.removable === false)"
            icon="delete"
            btn-class="btn_secondary"
            :aria-label="
              translate('condition') + ' ' + (typeof childAriaLabel == 'object' ? childAriaLabel.value : childAriaLabel)
            "
            @click="$emit('remove')"
          />
        </div>
      </div>
      <div
        v-else
        :class="classes.grid_container_for_transition"
        :has-group="endQueueFilter.type == 'group' ? '' : undefined"
      >
        <Condition
          v-if="endQueueFilter.type == 'condition' || endQueueFilter.type == 'scope'"
          v-bind="props"
          :model="endQueuePropertyModel"
          :model-value="endQueueFilter"
          :aria-label="translate('relationship_condition_with_condition')"
          @remove="removeEndFilter"
        >
          <template #relationship>
            <div :class="classes.relationship_queue">
              <RelationshipQueueElement
                v-for="elmnt in queue"
                :key="elmnt.key"
                v-bind="props"
                :model-value="elmnt.value"
                :model="elmnt.schema.name"
              />
            </div>
          </template>
          <template #shortcuts="shortcutsProps">
            <slot name="shortcuts" v-bind="shortcutsProps" />
          </template>
        </Condition>
        <Group
          v-else-if="endQueueFilter.type == 'group'"
          v-bind="props"
          :model="endQueuePropertyModel"
          :model-value="endQueueFilter"
          :aria-label="translate('relationship_condition_with_group')"
          @remove="removeEndFilter"
          @go-to-root-group="$emit('goToRootGroup')"
        >
          <template #relationship>
            <div :class="classes.relationship_queue">
              <RelationshipQueueElement
                v-for="elmnt in queue"
                :key="elmnt.key"
                v-bind="props"
                v-model="elmnt.value"
                :model="elmnt.schema.name"
              />
            </div>
          </template>
          <template #shortcuts="shortcutsProps">
            <slot name="shortcuts" v-bind="shortcutsProps" />
          </template>
        </Group>
      </div>
    </Transition>
  </template>
</template>
