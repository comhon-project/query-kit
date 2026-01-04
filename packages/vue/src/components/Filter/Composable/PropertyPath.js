import { computed, ref, shallowRef, watch } from 'vue';
import { getPropertyPath, getPropertyTranslation } from '@core/EntitySchema';
import { getSortableProperties } from '@core/RequestSchema';
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
    let currentEntity = props.entity;
    for (let property of propertyPath.value) {
      const sortableProperties = await getSortableProperties(currentEntity);
      if (!sortableProperties.includes(property.id)) {
        return false;
      }
      if (property.related) {
        currentEntity = property.related;
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
