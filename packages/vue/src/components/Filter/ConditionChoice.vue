<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { classes } from '../../core/ClassManager';
import { resolve, getPropertyTranslation } from '../../core/Schema';
import Utils from '../../core/Utils';
import { translate, locale } from '../../i18n/i18n';
import { getConditionOperators, getContainerOperators } from '../../core/OperatorManager';
import { useSearchable } from './Composable/Searchable';
import Modal from '../Common/Modal.vue';

const emit = defineEmits(['update:show', 'validate']);
const props = defineProps({
  show: {
    type: Boolean,
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
});

let condition = null;
const form = ref(false);
const uniqueName = ref(`choice-${Utils.getUniqueId()}`);
const uniqueIdCondition = ref(`choice-${Utils.getUniqueId()}`);
const uniqueIdGroup = ref(`choice-${Utils.getUniqueId()}`);
const schema = ref(null);
const targetCondition = ref(null);
const selectedType = ref('condition');
const { searchableProperties, searchableScopes, searchableComputedScopes } = useSearchable(props, schema);
const options = computed(() => {
  const options = {};
  for (const property of searchableProperties.value) {
    options[property.id] = getPropertyTranslation(property);
  }
  for (const scope of searchableScopes.value) {
    options[scope.id] = getPropertyTranslation(scope);
  }
  for (const scope of searchableComputedScopes.value) {
    if (scope.translation) {
      options[scope.id] = scope.translation(locale.value);
    } else if (scope.name) {
      options[scope.id] = scope.name;
    }
  }
  return options;
});
const displayGroup = computed(() => {
  return getContainerOperators('group', props.allowedOperators).length;
});
const isVisible = computed({
  get() {
    return props.show;
  },
  set(value) {
    emit('update:show', value);
  },
});

function validate(e) {
  condition = {};
  if (selectedType.value == 'condition') {
    const computedScope = props.computedScopes?.[props.model]?.find((scope) => scope.id == targetCondition.value);
    const scope = computedScope || schema.value.mapScopes[targetCondition.value];
    if (scope) {
      condition.type = 'scope';
      condition.id = targetCondition.value;
      if (scope.useOperator) {
        const operators = getConditionOperators(
          'scope',
          condition.id,
          schema.value,
          props.allowedOperators,
          props.computedScopes
        );
        condition.operator = operators[0];
      }
    } else {
      if (schema.value.mapProperties[targetCondition.value].type == 'relationship') {
        const operators = getContainerOperators('relationship_condition', props.allowedOperators);
        condition.operator = operators[0];
        condition.type = 'relationship_condition';
      } else {
        const operators = getConditionOperators(
          'condition',
          targetCondition.value,
          schema.value,
          props.allowedOperators
        );
        condition.operator = operators[0];
        condition.type = 'condition';
      }
      condition.property = targetCondition.value;
    }
  } else {
    const operators = getContainerOperators('group', props.allowedOperators);
    condition.type = 'group';
    condition.operator = operators[0];
    condition.filters = [];
  }
  condition.key = Utils.getUniqueId();
  isVisible.value = false;
  e.preventDefault();
}

function onClosed() {
  if (condition) {
    emit('validate', { ...condition });
    condition = null;
  }
}

function selectType(type) {
  selectedType.value = type;
}

function submitForm() {
  form.value.requestSubmit();
}

onMounted(async () => {
  schema.value = await resolve(props.model);
});
watch(
  () => props.model,
  async () => {
    schema.value = await resolve(props.model);
  }
);
</script>

<template>
  <Modal v-if="schema" v-model:show="isVisible" @confirm="submitForm" @closed="onClosed">
    <template #body>
      <form ref="form" :class="classes.condition_choice_form" @submit="validate">
        <div>
          <input
            :id="uniqueIdCondition"
            type="radio"
            :name="uniqueName"
            checked
            @click="() => selectType('condition')"
          />
          <label :for="uniqueIdCondition">{{ translate('condition') }}</label>
          <select
            v-model="targetCondition"
            :class="classes.input"
            :disabled="selectedType == 'group'"
            :aria-label="translate('choose_condition_element')"
            required
          >
            <option v-for="(display, value) in options" :key="value" :value="value">
              {{ display }}
            </option>
          </select>
        </div>
        <div v-if="displayGroup">
          <input :id="uniqueIdGroup" type="radio" :name="uniqueName" @click="() => selectType('group')" />
          <label :for="uniqueIdGroup">{{ translate('group') }}</label>
        </div>
      </form>
    </template>
  </Modal>
</template>
