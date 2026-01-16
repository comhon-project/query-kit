import { computed, type Ref, type ComputedRef } from 'vue';
import { getOperatorTranslation, getConditionOperators, getContainerOperators } from '@core/OperatorManager';
import { useSearchable, type SearchableProps } from '@components/Filter/Composable/Searchable';
import type { EntitySchema } from '@core/EntitySchema';
import type { FilterWithOperator, ConditionFilter } from '@core/types';

export interface FilterWithOperatorProps extends SearchableProps {
  modelValue: FilterWithOperator;
}

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
  props: FilterWithOperatorProps,
  schema: Ref<EntitySchema | null>,
): UseFilterWithOperatorReturn => {
  const { searchableProperties, searchableScopes, searchableComputedScopes } = useSearchable(props, schema);
  const isRemovable = computed(() => !(props.modelValue.removable === false));
  const isEditable = computed(() => !(props.modelValue.editable === false));
  const canEditOperator = computed(() => {
    return isEditable.value && operatorOptions.value.length > 1;
  });
  const operatorOptions = computed((): OperatorOption[] => {
    if (!schema.value) {
      throw new Error('schema must be loaded before calling operatorOptions');
    }

    const filterType = props.modelValue.type;
    const options: OperatorOption[] = [];
    const currentOperators =
      filterType === 'condition'
        ? getConditionOperators(
            filterType,
            (props.modelValue as ConditionFilter).property,
            schema.value,
            props.allowedOperators,
          )
        : getContainerOperators(filterType, props.allowedOperators);

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
