import { ref, watchEffect, type Ref } from 'vue';
import { getPropertyPath, getPropertyTranslation, type EntitySchema } from '@core/EntitySchema';
import { locale } from '@i18n/i18n';
import type { CustomFieldConfig } from '@core/types';

type FieldLabelConfig = { open?: boolean; label?: string | ((locale: string) => string) };

// false = unresolvable path; undefined = nothing to show (open field without a label).
export async function resolveFieldLabel(
  entityId: string,
  fieldId: string,
  config: FieldLabelConfig | undefined,
  currentLocale: string,
): Promise<string | false | undefined> {
  const customLabel = typeof config?.label === 'function' ? config.label(currentLocale) : config?.label;
  if (config?.open) return customLabel || undefined;
  if (customLabel) return customLabel;
  try {
    const path = await getPropertyPath(entityId, fieldId);
    return path.map((property) => getPropertyTranslation(property)).join(' ');
  } catch {
    return false;
  }
}

export function useColumnLabels(
  entitySchema: Ref<EntitySchema>,
  fields: Ref<string[]>,
  customFields: Ref<Record<string, CustomFieldConfig> | undefined>,
): Ref<Record<string, string>> {
  const labels = ref<Record<string, string>>({});

  watchEffect(async (onCleanup) => {
    let stale = false;
    onCleanup(() => (stale = true));
    const currentLocale = locale.value; // track before the awaits
    const entityId = entitySchema.value.id;
    const config = customFields.value;

    const entries = await Promise.all(
      fields.value.map(async (fieldId): Promise<[string, string] | undefined> => {
        const label = await resolveFieldLabel(entityId, fieldId, config?.[fieldId], currentLocale);
        if (label === undefined) return undefined;
        return [fieldId, label === false ? fieldId : label];
      }),
    );

    if (!stale) {
      labels.value = Object.fromEntries(entries.filter((entry): entry is [string, string] => entry !== undefined));
    }
  });

  return labels;
}
