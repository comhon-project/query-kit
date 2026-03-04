import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { reactive } from 'vue';
import Scope from '@components/Filter/Scope.vue';
import InvalidScope from '@components/Messages/InvalidScope.vue';
import ArrayableInput from '@components/Filter/ArrayableInput.vue';
import {
  resolve,
  registerLoader,
  registerTranslationsLoader,
  loadRawTranslations,
} from '@core/EntitySchema';
import { registerLoader as registerRequestLoader } from '@core/RequestSchema';
import { registerComputedScopes } from '@core/ComputedScopesManager';
import { entitySchemaLoader } from '@tests/assets/SchemaLoader';
import { requestSchemaLoader } from '@tests/assets/RequestSchemaLoader';
import { mountWithPlugin } from '@tests/helpers/mountPlugin';
import { builderConfigProvide } from '@tests/helpers/provideConfig';
import { flushAll } from '@tests/helpers/flushAsync';
import { locale } from '@i18n/i18n';
import type { VueWrapper } from '@vue/test-utils';
import type { EntitySchema, EntityTranslations } from '@core/EntitySchema';
import type { ScopeFilter } from '@core/types';

let wrapper: VueWrapper;
let schema: EntitySchema;

/** Translations loader that includes parameter translations for FR. */
const translationsWithParams = {
  load: async (name: string, loc: string): Promise<EntityTranslations | null> => {
    const locales: Record<string, Record<string, EntityTranslations>> = {
      user: {
        en: {
          properties: {
            first_name: 'first name',
            last_name: 'last name',
            age: 'the age',
            weight: 'the weight',
            married: 'is married',
            gender: 'the gender',
            birth_date: 'birth date',
            birth_day: 'birth day',
            birth_hour: 'birth hour',
            country: 'the country',
            company: 'the company',
            friend: 'the friend',
            favorite_fruits: 'favorite fruits',
          },
          scopes: {
            scope_string_definition: 'scope string definition',
            scope: 'scope without value',
            string_scope: 'string scope',
            datetime_scope: 'datetime scope',
            enum_scope: 'enum scope',
          },
        },
        fr: {
          properties: {
            first_name: 'prénom',
            last_name: 'nom',
          },
          scopes: {
            scope: 'scope sans valeur',
            string_scope: 'scope string',
            datetime_scope: 'scope date time',
            enum_scope: 'scope énum',
          },
          parameters: {
            string_scope: {
              value: 'valeur texte',
            },
          },
        },
      },
    };
    return locales[name]?.[loc] ?? null;
  },
};

beforeEach(async () => {
  registerLoader(entitySchemaLoader);
  registerTranslationsLoader(translationsWithParams);
  registerRequestLoader(requestSchemaLoader);
  schema = await resolve('user');
});

afterEach(() => {
  wrapper?.unmount();
});

function mountScope(
  filter: ScopeFilter,
  configOverrides: Record<string, unknown> = {},
) {
  wrapper = mountWithPlugin(Scope, {
    props: {
      modelValue: filter,
      entitySchema: schema,
    },
    global: { provide: builderConfigProvide(configOverrides) },
  });
}

describe('Scope', () => {
  it('renders scope name for valid scope', async () => {
    const filter: ScopeFilter = reactive({
      type: 'scope',
      id: 'scope',
      key: 1,
    });
    mountScope(filter);
    await flushAll();

    expect(wrapper.text()).toContain('scope without value');
  });

  it('renders parameters with labels for parameterized scope', async () => {
    const filter: ScopeFilter = reactive({
      type: 'scope',
      id: 'string_scope',
      parameters: [''],
      key: 2,
    });
    mountScope(filter);
    await flushAll();

    // The scope name should appear
    expect(wrapper.text()).toContain('string scope');
    // A parameter input should be rendered
    expect(wrapper.findComponent(ArrayableInput).exists()).toBe(true);
  });

  it('renders InvalidScope for unknown scope id', async () => {
    const filter: ScopeFilter = reactive({
      type: 'scope',
      id: 'nonexistent_scope',
      key: 3,
    });
    mountScope(filter);
    await flushAll();

    expect(wrapper.findComponent(InvalidScope).exists()).toBe(true);
    expect(wrapper.text()).toContain('nonexistent_scope');
  });

  it('emits remove when delete clicked', async () => {
    const filter: ScopeFilter = reactive({
      type: 'scope',
      id: 'scope',
      key: 4,
    });
    mountScope(filter);
    await flushAll();

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('remove')).toBeTruthy();
    expect(wrapper.emitted('remove')!.length).toBe(1);
  });

  it('hides delete when removable=false', async () => {
    const filter: ScopeFilter = reactive({
      type: 'scope',
      id: 'scope',
      removable: false,
      key: 5,
    });
    mountScope(filter);
    await flushAll();

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('disables parameter inputs when editable=false', async () => {
    const filter: ScopeFilter = reactive({
      type: 'scope',
      id: 'string_scope',
      parameters: ['test'],
      editable: false,
      key: 6,
    });
    mountScope(filter);
    await flushAll();

    const arrayableInput = wrapper.findComponent(ArrayableInput);
    expect(arrayableInput.exists()).toBe(true);
    expect(arrayableInput.props('editable')).toBe(false);
  });

  it('auto-initializes empty parameters array when scope has parameters but modelValue.parameters is null', async () => {
    const filter: ScopeFilter = reactive({
      type: 'scope',
      id: 'string_scope',
      parameters: null as unknown as undefined,
      key: 7,
    });
    mountScope(filter);
    await flushAll();

    expect(filter.parameters).toEqual([]);
  });

  it('does not render parameter section for scope without parameters', async () => {
    const filter: ScopeFilter = reactive({
      type: 'scope',
      id: 'scope',
      key: 8,
    });
    mountScope(filter);
    await flushAll();

    expect(wrapper.findComponent(ArrayableInput).exists()).toBe(false);
  });

  it('updates scope name when locale changes', async () => {
    await loadRawTranslations('user', 'fr');

    const filter: ScopeFilter = reactive({
      type: 'scope',
      id: 'scope',
      key: 9,
    });
    mountScope(filter);
    await flushAll();

    expect(wrapper.text()).toContain('scope without value');

    locale.value = 'fr';
    await flushAll();

    expect(wrapper.text()).toContain('scope sans valeur');
  });

  it('updates parameter labels when locale changes', async () => {
    await loadRawTranslations('user', 'fr');

    const filter: ScopeFilter = reactive({
      type: 'scope',
      id: 'string_scope',
      parameters: ['test'],
      key: 10,
    });
    mountScope(filter);
    await flushAll();

    // In EN, parameter label falls back to param.name = 'string scope'
    expect(wrapper.text()).toContain('string scope');

    locale.value = 'fr';
    await flushAll();

    // In FR, the parameter translation is 'valeur texte'
    expect(wrapper.text()).toContain('valeur texte');
  });

  describe('computed scopes (plugin integration)', () => {
    it('renders a computed scope name', async () => {
      registerComputedScopes({
        user: [{ id: 'cs_active', name: 'Active Users', computed: () => ({ active: true }) }],
      });

      const filter: ScopeFilter = reactive({
        type: 'scope',
        id: 'cs_active',
        key: 11,
      });
      mountScope(filter);
      await flushAll();

      expect(wrapper.findComponent(InvalidScope).exists()).toBe(false);
      expect(wrapper.text()).toContain('Active Users');
    });

    it('renders a computed scope with translation function', async () => {
      registerComputedScopes({
        user: [{
          id: 'cs_translated',
          computed: () => ({}),
          translation: (loc: string) => loc === 'fr' ? 'Utilisateurs actifs' : 'Active Users',
        }],
      });

      const filter: ScopeFilter = reactive({
        type: 'scope',
        id: 'cs_translated',
        key: 12,
      });
      mountScope(filter);
      await flushAll();

      expect(wrapper.text()).toContain('Active Users');

      locale.value = 'fr';
      await flushAll();

      expect(wrapper.text()).toContain('Utilisateurs actifs');
    });

    it('renders parameter inputs for a computed scope with parameters', async () => {
      registerComputedScopes({
        user: [{
          id: 'cs_with_params',
          name: 'Parameterized',
          computed: (params: unknown[]) => ({ min_age: params[0] }),
          parameters: [{ id: 'min_age', type: 'integer', name: 'Minimum Age' }],
        }],
      });

      const filter: ScopeFilter = reactive({
        type: 'scope',
        id: 'cs_with_params',
        parameters: [18],
        key: 13,
      });
      mountScope(filter);
      await flushAll();

      expect(wrapper.text()).toContain('Parameterized');
      expect(wrapper.text()).toContain('Minimum Age');
      expect(wrapper.findComponent(ArrayableInput).exists()).toBe(true);
    });

    it('uses computed scope parameter translation function', async () => {
      registerComputedScopes({
        user: [{
          id: 'cs_param_translated',
          name: 'With Param',
          computed: () => ({}),
          parameters: [{
            id: 'threshold',
            type: 'integer',
            translation: (loc: string) => loc === 'fr' ? 'Seuil' : 'Threshold',
          }],
        }],
      });

      const filter: ScopeFilter = reactive({
        type: 'scope',
        id: 'cs_param_translated',
        parameters: [10],
        key: 14,
      });
      mountScope(filter);
      await flushAll();

      expect(wrapper.text()).toContain('Threshold');

      locale.value = 'fr';
      await flushAll();

      expect(wrapper.text()).toContain('Seuil');
    });
  });
});
