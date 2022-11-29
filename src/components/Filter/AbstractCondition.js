import { computed, toRaw } from 'vue'
import { translate } from '../../i18n/i18n';
import { operatorNames, getOperators, useHelpers} from "./FilterManager";

const useBaseCondition = (props, schema, conditionType) => {
  const { searchableProperties, searchableScopes, searchableComputedScopes } = useHelpers(props, schema);
  const isRemovable = computed(() => !(props.modelValue.removable === false));
  const isEditable = computed(() => !(props.modelValue.editable === false));
  const canEditOperator = computed(() => {
    return isEditable.value && operatorOptions.value.length > 1;
  });
  const operatorOptions = computed(() => {
    const options = [];
    const operatorConditionType = conditionType == 'scope' ? 'condition' : conditionType;
    const currentOperators = conditionType == 'condition'
      ? getOperators(conditionType, props.allowedOperators, props.modelValue.property, schema)
      : conditionType == 'scope'
        ? getOperators(conditionType, props.allowedOperators, props.modelValue.id, schema, props.computedScopes)
        : getOperators(conditionType, props.allowedOperators);

    for (const operator of currentOperators) {
      let label = operatorNames[operatorConditionType][operator.toLowerCase()];
      if (label.charAt(0).match(/[a-z]/i)) {
        label = translate(label);
      }
      options.push({
        label: label,
        value: operator
      });
    }
    let has = false;
    for (const option of options) {
      if (option.value == props.modelValue.operator) {
        has = true;
        break;
      }
    }
    if (!has) {
      let label = operatorNames[operatorConditionType][props.modelValue.operator];
      if (label.charAt(0).match(/[a-z]/i)) {
        label = translate(label);
      }
      options.push({
        label: label,
        value: props.modelValue.operator,
      });
    }
    return options;
  });
  const canAddFilter = computed(() => {
    return isEditable.value && (searchableProperties.value.length || searchableScopes.value.length || searchableComputedScopes.value.length);
  });

  return { isRemovable, isEditable, canAddFilter, canEditOperator, operatorOptions };
}

export {
  useBaseCondition
}