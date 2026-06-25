<script setup lang="ts">
import { reactive, watchEffect, provide, onUnmounted } from 'vue';
import { type EntitySchema } from '@core/EntitySchema';
import Group from '@components/Filter/Group.vue';
import { classes } from '@core/ClassManager';
import { config as globalConfig } from '@config/config';
import { translate } from '@i18n/i18n';
import { useInternalModel } from '@components/Composable/InternalModel';
import { normalizeFilter, stripKeys } from '@core/filterNormalize';
import type { History } from '@components/Composable/History';
import type { AllowedOperators } from '@core/OperatorManager';
import {
  type Filter,
  type GroupFilter,
  type DisplayOperator,
  type AllowedScopes,
  type AllowedProperties,
  type FilterBuilderConfig,
} from '@core/types';
import { filterBuilderConfigKey } from '@core/InjectionKeys';

interface Props {
  entitySchema: EntitySchema;
  history?: History;
  allowedScopes?: AllowedScopes;
  allowedProperties?: AllowedProperties;
  allowedOperators?: AllowedOperators;
  displayOperator?: DisplayOperator;
  userTimezone?: string;
  requestTimezone?: string;
  collectionId?: string;
  aliasInsensitiveLabels?: boolean;
}

const modelValue = defineModel<Filter | null>({ default: null });

// undefined: prevent Vue from casting absent boolean props to false
const props = withDefaults(defineProps<Props>(), {
  history: undefined,
  displayOperator: undefined,
  aliasInsensitiveLabels: undefined,
});

const internalValue = useInternalModel<Filter | null, GroupFilter>(modelValue, {
  normalize: (val) => normalizeFilter(val, props.allowedOperators),
  strip: stripKeys,
});

props.history?.register('filter', internalValue);
onUnmounted(() => props.history?.unregister('filter'));

const config = reactive<FilterBuilderConfig>({} as FilterBuilderConfig);

provide(filterBuilderConfigKey, config);

function goToCollection(): void {
  if (props.collectionId) document.getElementById(props.collectionId)?.scrollIntoView();
}

watchEffect(() => {
  config.allowedScopes = props.allowedScopes;
  config.allowedProperties = props.allowedProperties;
  config.allowedOperators = props.allowedOperators;
  config.displayOperator = props.displayOperator ?? globalConfig.displayOperator;
  config.userTimezone = props.userTimezone ?? globalConfig.userTimezone;
  config.requestTimezone = props.requestTimezone ?? globalConfig.requestTimezone;
  config.aliasInsensitiveLabels = props.aliasInsensitiveLabels ?? globalConfig.aliasInsensitiveLabels;
});
</script>

<template>
  <section :class="classes.filter_builder" :aria-label="translate('filter')">
    <Group :model-value="internalValue" :entity-schema="entitySchema" @exit="goToCollection">
      <template #builder_actions>
        <slot name="actions" />
      </template>
    </Group>
  </section>
</template>
