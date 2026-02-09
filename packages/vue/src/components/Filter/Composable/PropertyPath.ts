import { computed, ref, shallowRef, watch, type Ref, type ComputedRef, type ShallowRef } from 'vue';
import { getPropertyPath, getPropertyTranslation, type Property, type EntitySchema } from '@core/EntitySchema';
import { getSortableProperties } from '@core/RequestSchema';
import { locale } from '@i18n/i18n';

export interface PropertyPathProps {
  entitySchema: EntitySchema;
  propertyId?: string;
  label?: string | ((locale: string) => string);
}

export interface UsePropertyPathReturn {
  propertyPath: ShallowRef<Property[] | false>;
  label: ComputedRef<string | undefined>;
  sortable: Ref<boolean>;
}

const usePropertyPath = (props: PropertyPathProps): UsePropertyPathReturn => {
  const sortable: Ref<boolean> = ref(false);
  const propertyPath: ShallowRef<Property[] | false> = shallowRef([]);
  const label = computed((): string | undefined => {
    const path = propertyPath.value;
    const currentLocale = locale.value;

    return props.label
      ? typeof props.label === 'function'
        ? props.label(currentLocale)
        : props.label
      : path
        ? path.map((property) => getPropertyTranslation(property)).join(' ')
        : undefined;
  });

  async function isSortable(): Promise<boolean> {
    const path = propertyPath.value;
    if (!path) return false;

    let currentEntity = props.entitySchema.id;
    for (const property of path) {
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
      propertyPath.value = props.propertyId ? await getPropertyPath(props.entitySchema.id, props.propertyId) : false;
      sortable.value = props.propertyId ? await isSortable() : false;
    },
    { immediate: true },
  );

  return { propertyPath, label, sortable };
};

export { usePropertyPath };
