import { computed, ref, shallowRef, watch } from 'vue';
import { getPropertyPath, getPropertyTranslation, resolve } from '@core/Schema';
import { locale } from '@i18n/i18n';

const usePropertyPath = (props) => {
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
      ? path.map((property) => getPropertyTranslation(property)).join(' ')
      : undefined;
  });

  async function isSortable() {
    let currentSchema = await resolve(props.entity);
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
      propertyPath.value = props.propertyId ? await getPropertyPath(props.entity, props.propertyId) : false;
      sortable.value = props.propertyId ? await isSortable() : false;
    },
    { immediate: true }
  );

  return { propertyPath, label, sortable };
};

export { usePropertyPath };
