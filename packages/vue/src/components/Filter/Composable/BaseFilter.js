import { computed } from 'vue';
import { getOperatorTranslation, getConditionOperators, getContainerOperators } from '@core/OperatorManager';
import { useSearchable } from '@components/Filter/Composable/Searchable';

const useBaseFilter = (props, schema, filterType) => {
  const { searchableProperties, searchableScopes, searchableComputedScopes } = useSearchable(props, schema);
  const isRemovable = computed(() => !(props.modelValue.removable === false));
  const isEditable = computed(() => !(props.modelValue.editable === false));
  const canEditOperator = computed(() => {
    return isEditable.value && operatorOptions.value.length > 1;
  });
  const operatorOptions = computed(() => {
    const options = [];
    const operatorKey = filterType == 'scope' ? 'condition' : filterType;
    const currentOperators =
      filterType == 'condition'
        ? getConditionOperators(filterType, props.modelValue.property, schema.value, props.allowedOperators)
        : filterType == 'scope'
        ? getConditionOperators(
            filterType,
            props.modelValue.id,
            schema.value,
            props.allowedOperators,
            props.computedScopes
          )
        : getContainerOperators(filterType, props.allowedOperators);

    for (const operator of currentOperators) {
      options.push({
        label: getOperatorTranslation(operatorKey, operator),
        value: operator,
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
      options.push({
        label: getOperatorTranslation(operatorKey, props.modelValue.operator),
        value: props.modelValue.operator,
      });
    }
    return options;
  });
  const canAddFilter = computed(() => {
    return (
      isEditable.value &&
      (searchableProperties.value.length || searchableScopes.value.length || searchableComputedScopes.value.length)
    );
  });

  return { isRemovable, isEditable, canAddFilter, canEditOperator, operatorOptions };
};

export { useBaseFilter };
