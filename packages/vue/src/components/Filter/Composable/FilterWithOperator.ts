import { computed, type ComputedRef } from 'vue';
import { getOperatorTranslation, getConditionOperators, getContainerOperators } from '@core/OperatorManager';
import { useSearchable } from '@components/Filter/Composable/Searchable';
import type { EntitySchema } from '@core/EntitySchema';
import type { FilterWithOperator, ConditionFilter, BuilderConfig } from '@core/types';

export interface OperatorOption {
  label: string;
  value: string;
}

export interface UseFilterWithOperatorReturn {
  isRemovable: ComputedRef<boolean>;
  isEditable: ComputedRef<boolean>;
  canAddFilter: ComputedRef<boolean>;
  canEditOperator: ComputedRef<boolean>;
  operatorOptions: ComputedRef<OperatorOption[]>;
}

const useFilterWithOperator = (
  config: BuilderConfig,
  props: { entitySchema: EntitySchema; modelValue: FilterWithOperator },
): UseFilterWithOperatorReturn => {
  const { searchableProperties, searchableScopes, searchableComputedScopes } = useSearchable(config, props);
  const isRemovable = computed(() => !(props.modelValue.removable === false));
  const isEditable = computed(() => !(props.modelValue.editable === false));
  const canEditOperator = computed(() => {
    return isEditable.value && operatorOptions.value.length > 1;
  });
  const operatorOptions = computed((): OperatorOption[] => {
    const filterType = props.modelValue.type;
    const options: OperatorOption[] = [];
    const currentOperators =
      filterType === 'condition'
        ? getConditionOperators(
            props.entitySchema.getProperty((props.modelValue as ConditionFilter).property),
            config.allowedOperators,
          )
        : getContainerOperators(filterType, config.allowedOperators);

    for (const operator of currentOperators) {
      options.push({
        label: getOperatorTranslation(filterType, operator),
        value: operator,
      });
    }
    let has = false;
    for (const option of options) {
      if (option.value === props.modelValue.operator) {
        has = true;
        break;
      }
    }
    if (!has && props.modelValue.operator) {
      options.push({
        label: getOperatorTranslation(filterType, props.modelValue.operator),
        value: props.modelValue.operator,
      });
    }
    return options;
  });
  const canAddFilter = computed(() => {
    return (
      isEditable.value &&
      !!(searchableProperties.value.length || searchableScopes.value.length || searchableComputedScopes.value.length)
    );
  });

  return { isRemovable, isEditable, canAddFilter, canEditOperator, operatorOptions };
};

export { useFilterWithOperator };
