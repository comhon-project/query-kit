<script setup>
  import { ref, watch, watchEffect, computed } from 'vue'
  import { resolve } from '../../core/Schema'
  import Group from './Group.vue';
  import Condition from './Condition.vue';
  import RelationshipQueueElement from './RelationshipQueueElement.vue';
  import { operatorNames } from './FilterManager';
  import InvalidModel from '../Messages/InvalidModel.vue';
  import InvalidProperty from '../Messages/InvalidProperty.vue';
  import InvalidOperator from '../Messages/InvalidOperator.vue';
  import IconButton from '../Common/IconButton.vue';
  import RelationshipAction from './RelationshipAction.vue';
  import Utils from '../../core/Utils';
  import { classes } from '../../core/ClassManager';
  import { translate } from '../../i18n/i18n';
  import Shortcuts from './Shortcuts.vue';

  const emit = defineEmits(['remove', 'goToNext', 'goToPrevious', 'goToParentGroup', 'goToRootGroup', 'addFilterToParentGroup']);
  const props = defineProps({
    modelValue: {
      type: Object,
      required: true
    },
    model: {
      type: String,
      required: true
    },
    computedScopes: {
      type: Object, // {modelname: [{id: 'scope_one', name: 'scope one', type: 'string', useOperator: true, computed: () => {...})}, ...], ...}
    },
    allowedScopes: {
      type: Object, // {modelname: ['scope_one', 'scope_two', ...], ...}
    },
    allowedProperties: {
      type: Object, // {modelname: ['property_name_one', 'property_name_two', ...], ...}
    },
    allowedOperators: {
      type: Object, // {condition: ['=', '<>', ...], group: ['AND', 'OR'], relationship_condition: ['HAS', 'HAS_NOT']}
    },
    displayOperator: {
      type: [Boolean, Object],
      default: true
    },
    userTimezone: {
      type: String,
      default: 'UTC'
    },
    requestTimezone: {
      type: String,
      default: 'UTC'
    },
    exceptShortcuts: {
      type: Array,
    },
    // not used, just permit to avoid warning when parent component pass ariaLabel prop
    ariaLabel: { 
      type: String
    },
    root: { // not used, just permit to avoid warning when parent component pass ariaLabel prop
      type: Boolean
    },
  });

  const invalidModel = ref(null);
  const invalidProperty = ref(null);
  const invalidOperator = ref(null);
  const childAriaLabel = ref('');
  const schema = ref(null);
  const queue = ref(null);
  const endQueueFilter = ref(null);
  const endQueuePropertyModel = computed(() => {
    const lastQueueElement = queue.value[queue.value.length - 1];
    const lastQueueSchema = lastQueueElement.schema;
    return  lastQueueSchema.mapProperties[lastQueueElement.value.property].model;
  });
  const shortcutEvents = {
    goToNext: () => emit('goToNext'),
    goToPrevious: () => emit('goToPrevious'),
    goToParentGroup: () => emit('goToParentGroup'),
    goToRootGroup: () => emit('goToRootGroup'),
    addFilterToParentGroup: () => emit('addFilterToParentGroup'),
  }

  async function initSchema()
  {
    schema.value = await resolve(props.model);
    if (!schema.value) {
      invalidModel.value = props.model;
      return;
    }
    setChild();
  }

  async function addFilter(filter)
  {
    const endQueuePropertySchema = await resolve(endQueuePropertyModel.value);
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

  function removeQueueFilter()
  {
    queue.value.pop();
    if (queue.value.length) {
      removeEndFilter()
    } else {
      emit('remove');
    }
  }

function removeEndFilter()
{
  queue.value[queue.value.length - 1].value.filter = null;
  endQueueFilter.value = null;
}

  async function setChild()
  {
    let childSchema = schema.value;
    let childFilter = props.modelValue;
    let tempQueue = [];
    while (childFilter && childFilter.type == 'relationship_condition') {
      tempQueue.push({
        key: Utils.getUniqueId(),
        value: childFilter,
        schema: childSchema,
      });
      const operator = typeof childFilter.operator == 'string' 
        ? childFilter.operator.toLowerCase() : childFilter.operator;
      if (!operatorNames['relationship_condition'][operator]) {
        invalidOperator.value = childFilter.operator;
        childFilter = null;
        return;
      }
      if (!childSchema.mapProperties[childFilter.property]) {
        invalidProperty.value = childFilter.property;
        childFilter = null;
        return;
      }
      childAriaLabel.value = childSchema.mapProperties[childFilter.property].name;
      
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
  <div v-if="invalidModel || invalidProperty || invalidOperator" :class="classes.condition_error_container" tabindex="0" :aria-label="translate('relationship_condition')">
      <div>
        <InvalidModel v-if="invalidModel" :model="invalidModel"/>
        <InvalidProperty v-else-if="invalidProperty" :property="invalidProperty"/>
        <InvalidOperator v-else-if="invalidOperator" :operator="invalidOperator"/>
      </div>
      <IconButton icon="delete" @click="$emit('remove')"/>
  </div>
  <template v-else-if="queue">
    <div v-if="!endQueueFilter" :class="classes.relationship_container" tabindex="0" :aria-label="translate('relationship_condition')">
      <div :class="classes.relationship_queue_and_action">
        <Shortcuts v-on="shortcutEvents" :except="exceptShortcuts"/>
        <div :class="classes.relationship_queue">
          <RelationshipQueueElement v-for="elmnt in queue" :key="elmnt.key" v-bind="props" :model-value="elmnt.value" :model="elmnt.schema.name"/>
        </div>
        <RelationshipAction v-bind="props" :model="endQueuePropertyModel" :model-value="queue[queue.length - 1].value" @remove="removeQueueFilter" @add="addFilter"/>
      </div>
      <IconButton v-if="!(queue[queue.length - 1].value.removable === false)" icon="delete" @click="$emit('remove')" :aria-label="translate('condition')+' '+childAriaLabel"/>
    </div>
    <template v-else>
      <Condition v-if="endQueueFilter.type == 'condition' || endQueueFilter.type == 'scope'" v-bind="props" :model="endQueuePropertyModel" :model-value="endQueueFilter" @remove="removeEndFilter" v-on="shortcutEvents" :aria-label="translate('relationship_condition_with_condition')">
        <template #relationship>
          <div :class="classes.relationship_queue">
            <RelationshipQueueElement v-for="elmnt in queue" :key="elmnt.key" v-bind="props" :model-value="elmnt.value" :model="elmnt.schema.name"/>
          </div>
        </template>
      </Condition>
      <Group v-else-if="endQueueFilter.type == 'group'" v-bind="props" :model="endQueuePropertyModel" :model-value="endQueueFilter" @remove="removeEndFilter" v-on="shortcutEvents" :aria-label="translate('relationship_condition_with_group')">
        <template #relationship>
          <div :class="classes.relationship_queue">
            <RelationshipQueueElement v-for="elmnt in queue" :key="elmnt.key" v-bind="props" v-model="elmnt.value" :model="elmnt.schema.name"/>
          </div>
        </template>
      </Group>
    </template>
  </template>
</template>