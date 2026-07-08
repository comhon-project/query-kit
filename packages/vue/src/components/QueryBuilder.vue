<script setup lang="ts">
import { ref, watch } from 'vue';
import FilterBuilder from '@components/Filter/FilterBuilder.vue';
import QueryActionsBar from '@components/Common/QueryActionsBar.vue';
import InvalidEntity from '@components/Messages/InvalidEntity.vue';
import { useHistory } from '@components/Composable/History';
import { resolve, type EntitySchema } from '@core/EntitySchema';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import type { AllowedOperators } from '@core/OperatorManager';
import type {
  Filter,
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
  collectionId?: string;
  manual?: boolean;
  aliasInsensitiveLabels?: boolean;
  actionsLocation?: 'header' | 'embedded';
}

interface Emits {
  validate: [];
}

const modelValue = defineModel<Filter | null>({ default: null });
const emit = defineEmits<Emits>();

// undefined: prevent Vue from casting absent boolean props to false
const props = withDefaults(defineProps<Props>(), {
  allowReset: undefined,
  allowUndo: undefined,
  allowRedo: undefined,
  displayOperator: undefined,
  manual: undefined,
  aliasInsensitiveLabels: undefined,
  actionsLocation: 'header',
});

const history = useHistory();
const entitySchema = ref<EntitySchema | null>(null);
const validEntity = ref(true);

watch(
  () => props.entity,
  async (entity, oldEntity) => {
    try {
      entitySchema.value = await resolve(entity);
      validEntity.value = true;
    } catch {
      entitySchema.value = null;
      validEntity.value = false;
      return;
    }
    if (oldEntity !== undefined && oldEntity !== entity) history.clear();
  },
  { immediate: true },
);

function onValidate(): void {
  emit('validate');
}
</script>

<template>
  <section :class="classes.query_builder" :aria-label="translate('query_builder')">
    <a v-if="collectionId" :href="'#' + collectionId" :class="classes.skip_link">{{ translate('go_to_collection') }}</a>
    <InvalidEntity v-if="!validEntity" :entity="entity" />
    <template v-else-if="entitySchema">
      <header v-if="actionsLocation === 'header'" :class="classes.query_builder_header">
        <QueryActionsBar
          :history="history"
          :allow-undo="allowUndo"
          :allow-redo="allowRedo"
          :allow-reset="allowReset"
          :manual="manual"
          @validate="onValidate"
        />
      </header>
      <FilterBuilder
        v-model="modelValue"
        :history="history"
        :entity-schema="entitySchema"
        :allowed-scopes="allowedScopes"
        :allowed-properties="allowedProperties"
        :allowed-operators="allowedOperators"
        :display-operator="displayOperator"
        :user-timezone="userTimezone"
        :request-timezone="requestTimezone"
        :collection-id="collectionId"
        :alias-insensitive-labels="aliasInsensitiveLabels"
      >
        <template v-if="actionsLocation === 'embedded'" #actions>
          <QueryActionsBar
            :history="history"
            :allow-undo="allowUndo"
            :allow-redo="allowRedo"
            :allow-reset="allowReset"
            :manual="manual"
            @validate="onValidate"
          />
        </template>
      </FilterBuilder>
    </template>
  </section>
</template>
