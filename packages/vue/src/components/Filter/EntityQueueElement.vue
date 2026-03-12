<script setup lang="ts">
import { computed, inject, watch } from 'vue';
import { getPropertyTranslation, type EntitySchema } from '@core/EntitySchema';
import { useFilterWithOperator } from '@components/Filter/Composable/FilterWithOperator';
import AdaptativeSelect from '@components/Common/AdaptativeSelect.vue';
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

watch(
  () => props.modelValue.operator,
  () => {
    if (property.value.type === 'object' && props.modelValue.operator === 'has_not') {
      if (props.modelValue.filter) {
        props.modelValue.filter = undefined;
      }
      emit('truncate');
    }
  },
);
</script>

<template>
  <li :class="classes.entity_condition_queue_item">
    <div v-if="config.displayOperator === true || (config.displayOperator && config.displayOperator.entity_condition)">
      <AdaptativeSelect
        v-model="modelValue.operator"
        :class="classes.operator"
        :options="operatorOptions"
        :disabled="!canEditOperator"
        :aria-label="label + ' ' + translate('operator')"
      />
    </div>
    <span :class="classes.property_label">
      {{ label }}
    </span>
  </li>
</template>
