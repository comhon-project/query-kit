<script setup>
  import { ref, watch, onMounted, computed } from 'vue'
  import { classes } from '../../core/ClassManager';
  import SchemaLoader from '../../core/SchemaLoader';
  import Utils from '../../core/Utils';
  import { translate } from '../../i18n/i18n';
  import IconButton from '../Common/IconButton.vue';
  import { getOperators, useHelpers } from './FilterManager';

  const emit = defineEmits(['validate']);
  const props = defineProps({
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
  });

  const uniqueName = ref(`choice-${Utils.getUniqueId()}`);
  const uniqueId1 = ref(`choice-${Utils.getUniqueId()}`);
  const uniqueId2 = ref(`choice-${Utils.getUniqueId()}`);
  const schema = ref(null);
  const targetCondition = ref(null);
  const tempType = ref('condition');
  const { searchableProperties, searchableScopes, searchableComputedScopes } = useHelpers(props, schema);
  const options = computed(() => {
    const options = {};
    for (const property of searchableProperties.value) {
      options[property.id] = property.name;
    }
    for (const scope of searchableScopes.value) {
      options[scope.id] = scope.name;
    }
    for (const scope of searchableComputedScopes.value) {
      options[scope.id] = scope.name;
    }
    return options;
  });
  const displayGroup = computed(() => {
    return !props.allowedOperators
      || !props.allowedOperators.group
      || props.allowedOperators.group.length;
  });

  function validate(e)
  {
    const condition = {};
    if (tempType.value == 'condition') {
      let scope = props.computedScopes && props.computedScopes[props.model]
        ? props.computedScopes[props.model].find(scope => scope.id == targetCondition.value)
        : schema.value.mapScopes[targetCondition.value];
      scope = scope || schema.value.mapScopes[targetCondition.value];
      if (scope) {
        condition.type = 'scope';
        condition.id = targetCondition.value;
        if (scope.useOperator) {
          const operators = getOperators('scope', props.allowedOperators, condition.id, schema, props.computedScopes);
          condition.operator = operators[0];
        }
      } else {
        if (schema.value.mapProperties[targetCondition.value].type == 'relationship') {
          const operators = getOperators('relationship_condition', props.allowedOperators);
          condition.operator = operators[0];
          condition.type = 'relationship_condition';
        } else {
          const operators = getOperators('condition', props.allowedOperators, targetCondition.value, schema);
          condition.operator = operators[0];
          condition.type = 'condition';
        }
        condition.property = targetCondition.value;
      }
    }else {
      const operators = getOperators('group', props.allowedOperators);
      condition.type = 'group';
      condition.operator = operators[0];
      condition.filters = [];
    }
    condition.key = Utils.getUniqueId();
    emit ('validate', condition);
    e.preventDefault();
  }

  function selectType(type)
  {
    tempType.value = type;
  }

  onMounted(async () => {
    schema.value = await SchemaLoader.getComputedSchema(props.model);
  });
  watch(() => props.model, async () => {
    schema.value = await SchemaLoader.getComputedSchema(props.model);
  });
</script>

<template>
  <div v-if="schema">
    <form @submit="validate" :class="classes.condition_choice_form">
      <div>
        <input type="radio" @click="() => selectType('condition')" :name="uniqueName" :id="uniqueId1" checked/>
        <label :for="uniqueId1">{{ translate('condition') }}</label>
        <select v-model="targetCondition" :disabled="tempType == 'group'" required>
          <option v-for="(display, value) in options" :key="value" :value="value">{{ display }}</option>
        </select>
      </div>
      <div v-if="displayGroup">
        <input type="radio" @click="() => selectType('group')" :name="uniqueName" :id="uniqueId2"/>
        <label :for="uniqueId2">{{ translate('group') }}</label>
      </div>
      <div>
        <IconButton icon="validate" type="submit"/>
      </div>
    </form>
  </div>
</template>

<style scoped>

</style>