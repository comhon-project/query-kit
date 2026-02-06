<script setup lang="ts">
import { computed, ref, watchEffect, inject } from 'vue';
import { resolve, getPropertyTranslation, type EntitySchema } from '@core/EntitySchema';
import { useFilterWithOperator } from '@components/Filter/Composable/FilterWithOperator';
import AdaptativeSelect from '@components/Common/AdaptativeSelect.vue';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import { type RelationshipConditionFilter } from '@core/types';
import { builderConfigKey } from '@core/InjectionKeys';

interface Props {
  modelValue: RelationshipConditionFilter;
  entity: string;
}

interface Emits {
  remove: [];
  'end:relationship': [];
}

defineEmits<Emits>();
const props = defineProps<Props>();
const config = inject(builderConfigKey)!;
const schema = ref<EntitySchema | null>(null);
const { canEditOperator, operatorOptions } = useFilterWithOperator(props.modelValue, config, schema);
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
    <div
      v-if="config.displayOperator === true || (config.displayOperator && config.displayOperator.relationship_condition)"
    >
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
