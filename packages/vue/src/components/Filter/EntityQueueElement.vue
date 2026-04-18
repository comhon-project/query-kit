<script setup lang="ts">
import { computed, inject, watch, watchEffect } from 'vue';
import { getPropertyTranslation, type EntitySchema } from '@core/EntitySchema';
import { useFilterWithOperator } from '@components/Filter/Composable/FilterWithOperator';
import AdaptativeSelect from '@components/Common/AdaptativeSelect.vue';
import SelectEntities from '@components/Common/SelectEntities.vue';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import { type EntityConditionFilter } from '@core/types';
import { builderConfigKey } from '@core/InjectionKeys';

interface Props {
  modelValue: EntityConditionFilter;
  entitySchema: EntitySchema;
}

interface Emits {
  remove: [];
  truncate: [];
}

const emit = defineEmits<Emits>();
const props = defineProps<Props>();
const config = inject(builderConfigKey)!;
const { canEditOperator, operatorOptions } = useFilterWithOperator(config, props);
const property = computed(() => props.entitySchema.getProperty(props.modelValue.property));
const label = computed<string>(() => getPropertyTranslation(property.value));
const isMorphToWithEntities = computed(
  () => property.value.relationship_type === 'morph_to' && !!property.value.entities?.length,
);
const showOperator = computed(
  () => config.displayOperator === true || (config.displayOperator && config.displayOperator.entity_condition),
);
const showCount = computed(
  () => showOperator.value && property.value.type === 'relationship' && props.modelValue.operator === 'has',
);

const countOperatorOptions = computed(() => [
  { value: '>=', label: translate('at_least') ?? '>=' },
  { value: '<=', label: translate('at_most') ?? '<=' },
  { value: '=', label: translate('exactly') ?? '=' },
]);

function onEntitiesUpdate(value: string[]): void {
  props.modelValue.entities = value;
  props.modelValue.filter = undefined;
  emit('truncate');
}

watchEffect(() => {
  if (showCount.value && props.modelValue.count_operator === undefined) {
    props.modelValue.count_operator = '>=';
    props.modelValue.count = 1;
  }
});

watch(
  () => props.modelValue.operator,
  () => {
    if (props.modelValue.operator === 'has_not') {
      delete props.modelValue.count_operator;
      delete props.modelValue.count;
      if (property.value.type === 'object') {
        if (props.modelValue.filter) {
          props.modelValue.filter = undefined;
        }
        emit('truncate');
      }
    }
  },
);
</script>

<template>
  <li :class="classes.entity_condition_queue_item">
    <div v-if="showOperator">
      <AdaptativeSelect
        v-model="modelValue.operator"
        :class="classes.operator"
        :options="operatorOptions"
        :disabled="!canEditOperator"
        :aria-label="label + ' ' + translate('operator')"
      />
    </div>
    <template v-if="showCount">
      <AdaptativeSelect
        v-model="modelValue.count_operator!"
        :class="classes.operator"
        :options="countOperatorOptions"
        :disabled="!canEditOperator"
        :aria-label="label + ' ' + translate('operator')"
      />
      <input
        v-model.number="modelValue.count"
        type="number"
        :class="classes.input"
        :disabled="!canEditOperator"
        min="1"
      />
    </template>
    <span :class="classes.property_label">
      {{ label }}
    </span>
    <SelectEntities
      v-if="isMorphToWithEntities"
      :model-value="modelValue.entities ?? []"
      :options="property.entities!"
      @update:model-value="onEntitiesUpdate"
    />
  </li>
</template>
