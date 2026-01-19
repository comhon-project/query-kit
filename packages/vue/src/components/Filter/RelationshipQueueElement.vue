<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { resolve, getPropertyTranslation, type EntitySchema } from '@core/EntitySchema';
import { useFilterWithOperator } from '@components/Filter/Composable/FilterWithOperator';
import AdaptativeSelect from '@components/Common/AdaptativeSelect.vue';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import type { AllowedOperators, ComputedScopes } from '@core/OperatorManager';
import type { RelationshipConditionFilter, DisplayOperator, AllowedScopes, AllowedProperties } from '@core/types';

interface Props {
  modelValue: RelationshipConditionFilter;
  entity: string;
  computedScopes?: ComputedScopes;
  allowedScopes?: AllowedScopes;
  allowedProperties?: AllowedProperties;
  allowedOperators?: AllowedOperators;
  displayOperator?: DisplayOperator;
}

interface Emits {
  remove: [];
  'end:relationship': [];
}

defineEmits<Emits>();
const props = withDefaults(defineProps<Props>(), {
  displayOperator: true,
});
const schema = ref<EntitySchema | null>(null);
const { canEditOperator, operatorOptions } = useFilterWithOperator(props, schema);
const label = computed<string>(() => {
  if (!schema.value) return '';
  return getPropertyTranslation(schema.value.getProperty(props.modelValue.property));
});

async function initSchema(): Promise<void> {
  schema.value = await resolve(props.entity);
}

watchEffect(initSchema);
</script>

<template>
  <div v-if="schema" :class="classes.relationship_queue_element">
    <div v-if="displayOperator === true || (displayOperator && displayOperator.relationship_condition)">
      <AdaptativeSelect
        v-model="modelValue.operator"
        :class="classes.operator"
        :options="operatorOptions"
        :disabled="!canEditOperator"
        :aria-label="label + ' ' + translate('operator')"
      />
    </div>
    <span :class="classes.property_name_container">
      {{ label }}
    </span>
  </div>
</template>
