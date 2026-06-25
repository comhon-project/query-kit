<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import FilterBuilder from '@components/Filter/FilterBuilder.vue';
import QueryActionsBar from '@components/Common/QueryActionsBar.vue';
import InvalidEntity from '@components/Messages/InvalidEntity.vue';
import { useHistory } from '@components/Composable/History';
import { resolve, type EntitySchema } from '@core/EntitySchema';
import { classes } from '@core/ClassManager';
import { translate } from '@i18n/i18n';
import { deepEqual } from '@core/Utils';
import { computeFilter } from '@core/computeFilter';
import { config as globalConfig } from '@config/config';
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
  actionsLocation?: 'header' | 'embedded';
}

interface Emits {
  computed: [filter: GroupFilter, manual: boolean];
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
let firstEmitDone = false;
let lastComputedEmitted: GroupFilter | null = null;
let computeTimer: ReturnType<typeof setTimeout> | undefined;
let computeSeq = 0;

async function runCompute(): Promise<void> {
  firstEmitDone = true;
  const seq = ++computeSeq;
  let computed: GroupFilter;
  try {
    computed = await computeFilter(modelValue.value, props.entity);
  } catch (error) {
    console.warn('[query-kit] computeFilter failed, keeping last result', error);
    firstEmitDone = false;
    return;
  }
  if (seq === computeSeq && !deepEqual(computed, lastComputedEmitted)) {
    lastComputedEmitted = computed;
    emit('computed', computed, false);
  }
}

function scheduleCompute(immediate: boolean): void {
  if (computeTimer) clearTimeout(computeTimer);
  const debounce = props.debounce ?? globalConfig.debounce;
  if (immediate || !debounce) {
    runCompute();
  } else {
    computeTimer = setTimeout(runCompute, debounce);
  }
}

watch(
  [() => props.entity, modelValue],
  async (newVals, oldVals) => {
    const entity = newVals[0] as string;
    const entityChanged = !oldVals || entity !== oldVals[0];
    if (entityChanged) {
      try {
        entitySchema.value = await resolve(entity);
        validEntity.value = true;
      } catch {
        entitySchema.value = null;
        validEntity.value = false;
        return;
      }
      if (oldVals) history.clear();
      firstEmitDone = false;
      lastComputedEmitted = null;
    }
    const manual = props.manual ?? globalConfig.manual;
    if ((!manual || !firstEmitDone) && entitySchema.value) {
      scheduleCompute(!firstEmitDone || entityChanged);
    }
  },
  { immediate: true, deep: true },
);

onUnmounted(() => {
  if (computeTimer) clearTimeout(computeTimer);
});

async function onValidate(): Promise<void> {
  if (computeTimer) clearTimeout(computeTimer);
  const seq = ++computeSeq;
  let computed: GroupFilter;
  try {
    computed = await computeFilter(modelValue.value, props.entity);
  } catch (error) {
    console.warn('[query-kit] computeFilter failed on validate, keeping last result', error);
    return;
  }
  if (seq === computeSeq) {
    lastComputedEmitted = computed;
    emit('computed', computed, true);
  }
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
