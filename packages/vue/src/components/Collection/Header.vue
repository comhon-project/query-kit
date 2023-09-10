<script setup>
import { computed, ref, shallowRef, watch } from 'vue';
import { classes } from '../../core/ClassManager';
import { locale } from '../../i18n/i18n';
import { getPropertyPath, resolve } from '../../core/Schema';

defineEmits(['click']);
const props = defineProps({
  model: {
    type: String,
    required: true,
  },
  propertyId: {
    type: String,
    default: undefined,
  },
  label: {
    type: [String, Function],
    default: undefined,
  },
  active: {
    type: Boolean,
  },
  order: {
    type: String,
    default: undefined,
  },
});

const sortable = ref(false);
const propertyPath = shallowRef([]);
const label = computed(() => {
  const path = propertyPath.value;
  const currentLocale = locale.value;

  return props.label
    ? typeof props.label == 'function'
      ? props.label(currentLocale)
      : props.label
    : path
    ? path.map((property) => property.name.value).join(' ')
    : undefined;
});
const buttonClass = computed(() => {
  return (
    classes.btn +
    ' ' +
    (props.active ? classes.active + ' ' + (props.order == 'asc' ? classes.order_asc : classes.order_desc) : '')
  );
});

async function isSortable() {
  let currentSchema = await resolve(props.model);
  for (let property of propertyPath.value) {
    if (
      !currentSchema.search ||
      !Array.isArray(currentSchema.search.sort) ||
      !currentSchema.search.sort.includes(property.id)
    ) {
      return false;
    }
    if (property.model) {
      // add condition just for the very last property that probably don't have model
      currentSchema = await resolve(property.model);
    }
  }
  return true;
}

watch(
  () => props.propertyId,
  async () => {
    propertyPath.value = props.propertyId ? await getPropertyPath(props.model, props.propertyId) : false;
    sortable.value = props.propertyId ? await isSortable() : false;
  },
  { immediate: true }
);
</script>

<template>
  <th>
    <button v-if="sortable" type="button" :class="buttonClass" @click="$emit('click', propertyId)">
      {{ label }}
    </button>
    <div v-else>
      {{ label }}
    </div>
  </th>
</template>
