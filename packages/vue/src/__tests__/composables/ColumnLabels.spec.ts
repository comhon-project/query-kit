import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { effectScope, ref, type EffectScope, type Ref } from 'vue';
import { resolveFieldLabel, useColumnLabels } from '@components/Composable/ColumnLabels';
import { resolve, registerLoader, registerTranslationsLoader, loadRawTranslations } from '@core/EntitySchema';
import { locale } from '@i18n/i18n';
import { entitySchemaLoader, entityTranslationsLoader } from '@tests/assets/SchemaLoader';
import { flushAll } from '@tests/helpers/flushAsync';
import type { EntitySchema } from '@core/EntitySchema';
import type { CustomFieldConfig } from '@core/types';

let userSchema: EntitySchema;

beforeEach(async () => {
  registerLoader(entitySchemaLoader);
  registerTranslationsLoader(entityTranslationsLoader);
  userSchema = await resolve('user');
});

describe('resolveFieldLabel', () => {
  it('resolves a property path to its translated label', async () => {
    expect(await resolveFieldLabel('user', 'first_name', undefined, 'en')).toBe('first name');
  });

  it('returns a custom string label without touching the schema', async () => {
    expect(await resolveFieldLabel('user', 'first_name', { label: 'Custom' }, 'en')).toBe('Custom');
  });

  it('calls a custom label function with the given locale', async () => {
    const label = (loc: string) => (loc === 'fr' ? 'Prénom' : 'First');
    expect(await resolveFieldLabel('user', 'first_name', { label }, 'fr')).toBe('Prénom');
  });

  it('returns the custom label for an open field', async () => {
    expect(await resolveFieldLabel('user', 'my_field', { open: true, label: 'Full name' }, 'en')).toBe('Full name');
  });

  it('returns undefined for an open field without a label', async () => {
    expect(await resolveFieldLabel('user', 'my_field', { open: true }, 'en')).toBeUndefined();
  });

  it('returns false for an unresolvable property path', async () => {
    expect(await resolveFieldLabel('user', 'nonexistent_field', undefined, 'en')).toBe(false);
  });
});

describe('useColumnLabels', () => {
  let scope: EffectScope | undefined;

  afterEach(() => {
    scope?.stop();
    scope = undefined;
  });

  function run(fields: Ref<string[]>, customFields: Ref<Record<string, CustomFieldConfig> | undefined>) {
    let labels!: Ref<Record<string, string>>;
    scope = effectScope();
    scope.run(() => {
      labels = useColumnLabels(ref(userSchema), fields, customFields);
    });
    return labels;
  }

  it('resolves every column label once', async () => {
    const labels = run(ref(['first_name', 'last_name']), ref(undefined));
    await flushAll();
    expect(labels.value).toEqual({ first_name: 'first name', last_name: 'last name' });
  });

  it('re-resolves when the locale changes', async () => {
    await loadRawTranslations('user', 'fr');
    const labels = run(ref(['first_name']), ref(undefined));
    await flushAll();
    expect(labels.value).toEqual({ first_name: 'first name' });

    locale.value = 'fr';
    await flushAll();
    expect(labels.value).toEqual({ first_name: 'prénom' });
  });

  it('omits open fields without a label', async () => {
    const labels = run(ref(['open_field']), ref({ open_field: { open: true, label: undefined } as unknown as CustomFieldConfig }));
    await flushAll();
    expect(labels.value).toEqual({});
  });

  it('falls back to the field id for an unresolvable path', async () => {
    const labels = run(ref(['first_name', 'nonexistent_field']), ref(undefined));
    await flushAll();
    expect(labels.value).toEqual({ first_name: 'first name', nonexistent_field: 'nonexistent_field' });
  });
});
