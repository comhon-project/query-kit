<script setup lang="ts">
import FilterBuilder from '@components/Filter/FilterBuilder.vue';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import type { AllowedOperators } from '@core/OperatorManager';
import type {
  Filter,
  GroupFilter,
  DisplayOperator,
  AllowedScopes,
  AllowedProperties,
} from '@core/types';

interface Props {
  entity: string;
  allowReset?: boolean;
  allowUndo?: boolean;
  allowRedo?: boolean;
  allowedScopes?: AllowedScopes;
  allowedProperties?: AllowedProperties;
  allowedOperators?: AllowedOperators;
  displayOperator?: DisplayOperator;
  userTimezone?: string;
  requestTimezone?: string;
  debounce?: number;
  collectionId?: string;
  manual?: boolean;
  aliasInsensitiveLabels?: boolean;
}

interface Emits {
  computed: [filter: GroupFilter, manual: boolean];
}

const modelValue = defineModel<Filter | null>({ default: null });
const emit = defineEmits<Emits>();

// undefined: prevent Vue from casting absent boolean props to false
withDefaults(defineProps<Props>(), {
  allowReset: undefined,
  allowUndo: undefined,
  allowRedo: undefined,
  displayOperator: undefined,
  manual: undefined,
  aliasInsensitiveLabels: undefined,
});
</script>

<template>
  <section :class="classes.query_builder" :aria-label="translate('query_builder')">
    <a v-if="collectionId" :href="'#' + collectionId" :class="classes.skip_link">{{ translate('go_to_collection') }}</a>
    <FilterBuilder
      v-model="modelValue"
      :entity="entity"
      :allow-reset="allowReset"
      :allow-undo="allowUndo"
      :allow-redo="allowRedo"
      :allowed-scopes="allowedScopes"
      :allowed-properties="allowedProperties"
      :allowed-operators="allowedOperators"
      :display-operator="displayOperator"
      :user-timezone="userTimezone"
      :request-timezone="requestTimezone"
      :debounce="debounce"
      :collection-id="collectionId"
      :manual="manual"
      :alias-insensitive-labels="aliasInsensitiveLabels"
      @computed="(computedFilter, isManual) => emit('computed', computedFilter, isManual)"
    />
  </section>
</template>
