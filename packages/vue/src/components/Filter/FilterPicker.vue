<script setup lang="ts">
import { ref, computed, useTemplateRef, inject } from 'vue';
import { classes } from '@core/ClassManager';
import { getPropertyTranslation, getScopeTranslation, type EntitySchema, type Scope } from '@core/EntitySchema';
import { getUniqueId } from '@core/Utils';
import { translate } from '@i18n/i18n';
import { getConditionOperators, getContainerOperators } from '@core/OperatorManager';
import { getComputedScope, getComputedScopeTranslation, type ComputedScope } from '@core/ComputedScopesManager';
import { useSearchable } from '@components/Filter/Composable/Searchable';
import Modal from '@components/Common/Modal.vue';
import InvalidProperty from '@components/Messages/InvalidProperty.vue';
import InvalidScope from '@components/Messages/InvalidScope.vue';
import { type Filter } from '@core/types';
import { builderConfigKey } from '@core/InjectionKeys';

interface Props {
  entitySchema: EntitySchema;
}

interface Emits {
  validate: [condition: Filter];
}

const emit = defineEmits<Emits>();
const show = defineModel<boolean>('show', { required: true });
const props = defineProps<Props>();
const config = inject(builderConfigKey)!;

let condition: Filter | null = null;
const form = useTemplateRef<HTMLFormElement>('form');
const uniqueName = ref<string>(`choice-${getUniqueId()}`);
const uniqueIdCondition = ref<string>(`choice-${getUniqueId()}`);
const uniqueIdGroup = ref<string>(`choice-${getUniqueId()}`);
const targetCondition = ref<string | null>(null);
const selectedType = ref<'condition' | 'group'>('condition');
const { searchableProperties, searchableScopes, searchableComputedScopes, invalidProperties, invalidScopes } =
  useSearchable(config, props);

const options = computed<Record<string, string>>(() => {
  const opts: Record<string, string> = {};
  for (const property of searchableProperties.value) {
    opts[property.id] = getPropertyTranslation(property);
  }
  for (const scope of searchableScopes.value) {
    opts[scope.id] = getScopeTranslation(scope);
  }
  for (const scope of searchableComputedScopes.value) {
    opts[scope.id] = getComputedScopeTranslation(scope);
  }
  return opts;
});

const displayGroup = computed<number>(() => {
  return getContainerOperators('group', config.allowedOperators).length;
});

function validate(): void {
  if (selectedType.value === 'condition' && !targetCondition.value) return;

  if (selectedType.value == 'condition') {
    const target = targetCondition.value!;
    let scope: ComputedScope | Scope | undefined = getComputedScope(props.entitySchema.id, target);
    if (!scope) {
      try {
        scope = props.entitySchema.getScope(target);
      } catch {
        scope = undefined;
      }
    }
    if (scope) {
      condition = {
        type: 'scope',
        id: target,
        parameters: [],
      };
    } else {
      const property = props.entitySchema.getProperty(target);
      if (property.type == 'relationship') {
        const operators = getContainerOperators('relationship_condition', config.allowedOperators);
        condition = {
          type: 'relationship_condition',
          operator: operators[0],
          property: target,
        };
      } else {
        const operators = getConditionOperators(property, config.allowedOperators);
        condition = {
          type: 'condition',
          operator: operators[0],
          property: target,
        };
      }
    }
  } else {
    const operators = getContainerOperators('group', config.allowedOperators);
    condition = {
      type: 'group',
      operator: operators[0],
      filters: [],
    };
  }
  show.value = false;
}

function onClosed(): void {
  if (condition) {
    emit('validate', { ...condition, key: getUniqueId() });
    condition = null;
  }
}

function selectType(type: 'condition' | 'group'): void {
  selectedType.value = type;
}

function submitForm(): void {
  form.value?.requestSubmit();
}
</script>

<template>
  <Modal v-model:show="show" @confirm="submitForm" @closed="onClosed">
    <template #body>
      <InvalidProperty v-for="name in invalidProperties" :key="name" :property="name" />
      <InvalidScope v-for="id in invalidScopes" :key="id" :id="id" />
      <form ref="form" :class="classes.filter_picker" @submit.prevent="validate">
        <fieldset>
          <legend :class="classes.sr_only">{{ translate('choose_condition_element') }}</legend>
          <div>
            <input
              :id="uniqueIdCondition"
              type="radio"
              :name="uniqueName"
              checked
              @click="() => selectType('condition')"
            />
            <label :for="uniqueIdCondition">{{ translate('condition') }}</label>
            <select
              v-model="targetCondition"
              :class="classes.input"
              :disabled="selectedType == 'group'"
              :aria-label="translate('choose_condition_element')"
              required
            >
              <option v-for="(display, value) in options" :key="value" :value="value">
                {{ display }}
              </option>
            </select>
          </div>
          <div v-if="displayGroup">
            <input :id="uniqueIdGroup" type="radio" :name="uniqueName" @click="() => selectType('group')" />
            <label :for="uniqueIdGroup">{{ translate('group') }}</label>
          </div>
        </fieldset>
      </form>
    </template>
  </Modal>
</template>
