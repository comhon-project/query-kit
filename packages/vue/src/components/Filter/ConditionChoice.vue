<script setup lang="ts">
import { ref, watchEffect, computed, useTemplateRef } from 'vue';
import { classes } from '@core/ClassManager';
import { resolve, getPropertyTranslation, getScopeTranslation, type EntitySchema } from '@core/EntitySchema';
import Utils from '@core/Utils';
import { translate, locale } from '@i18n/i18n';
import {
  getConditionOperators,
  getContainerOperators,
  type AllowedOperators,
  type ComputedScopes,
  type ComputedScope,
} from '@core/OperatorManager';
import { useSearchable } from '@components/Filter/Composable/Searchable';
import Modal from '@components/Common/Modal.vue';
import type { Filter, AllowedScopes, AllowedProperties } from '@core/types';

interface Props {
  entity: string;
  computedScopes?: ComputedScopes;
  allowedScopes?: AllowedScopes;
  allowedProperties?: AllowedProperties;
  allowedOperators?: AllowedOperators;
}

interface Emits {
  validate: [condition: Filter];
}

const emit = defineEmits<Emits>();
const show = defineModel<boolean>('show', { required: true });
const props = defineProps<Props>();

let condition: Filter | null = null;
const form = useTemplateRef<HTMLFormElement>('form');
const uniqueName = ref<string>(`choice-${Utils.getUniqueId()}`);
const uniqueIdCondition = ref<string>(`choice-${Utils.getUniqueId()}`);
const uniqueIdGroup = ref<string>(`choice-${Utils.getUniqueId()}`);
const schema = ref<EntitySchema | null>(null);
const targetCondition = ref<string | null>(null);
const selectedType = ref<'condition' | 'group'>('condition');
const { searchableProperties, searchableScopes, searchableComputedScopes } = useSearchable(props, schema);

const options = computed<Record<string, string>>(() => {
  const opts: Record<string, string> = {};
  for (const property of searchableProperties.value) {
    opts[property.id] = getPropertyTranslation(property);
  }
  for (const scope of searchableScopes.value) {
    opts[scope.id] = getScopeTranslation(scope);
  }
  for (const scope of searchableComputedScopes.value) {
    if ((scope as ComputedScope & { translation?: (locale: string) => string }).translation) {
      opts[scope.id] = (scope as ComputedScope & { translation: (locale: string) => string }).translation(locale.value);
    } else if (scope.name) {
      opts[scope.id] = scope.name;
    }
  }
  return opts;
});

const displayGroup = computed<number>(() => {
  return getContainerOperators('group', props.allowedOperators).length;
});

function validate(): void {
  if (!schema.value || (selectedType.value === 'condition' && !targetCondition.value)) return;

  if (selectedType.value == 'condition') {
    const target = targetCondition.value!;
    const computedScope = props.computedScopes?.[props.entity]?.find((scope) => scope.id == target);
    const scope = computedScope || schema.value.mapScopes[target];
    if (scope) {
      condition = {
        type: 'scope',
        id: target,
        parameters: [],
        key: Utils.getUniqueId(),
      };
    } else {
      if (schema.value.mapProperties[target]?.type == 'relationship') {
        const operators = getContainerOperators('relationship_condition', props.allowedOperators);
        condition = {
          type: 'relationship_condition',
          operator: operators[0],
          property: target,
          key: Utils.getUniqueId(),
        };
      } else {
        const operators = getConditionOperators('condition', target, schema.value, props.allowedOperators);
        condition = {
          type: 'condition',
          operator: operators[0],
          property: target,
          key: Utils.getUniqueId(),
        };
      }
    }
  } else {
    const operators = getContainerOperators('group', props.allowedOperators);
    condition = {
      type: 'group',
      operator: operators[0],
      filters: [],
      key: Utils.getUniqueId(),
    };
  }
  show.value = false;
}

function onClosed(): void {
  if (condition) {
    emit('validate', { ...condition });
    condition = null;
  }
}

function selectType(type: 'condition' | 'group'): void {
  selectedType.value = type;
}

function submitForm(): void {
  form.value?.requestSubmit();
}

watchEffect(async () => {
  schema.value = await resolve(props.entity);
});
</script>

<template>
  <Modal v-if="schema" v-model:show="show" @confirm="submitForm" @closed="onClosed">
    <template #body>
      <form ref="form" :class="classes.condition_choice_form" @submit.prevent="validate">
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
      </form>
    </template>
  </Modal>
</template>
