import type { RawScope, RawScopeParameter } from '@core/EntitySchema';
import { locale } from '@i18n/i18n';

export interface ComputedScopeParameter extends RawScopeParameter {
  translation?: (locale: string) => string;
}

export interface ComputedScope extends Omit<RawScope, 'parameters'> {
  computed: (parameters: unknown[]) => Record<string, unknown>;
  translation?: (locale: string) => string;
  parameters?: ComputedScopeParameter[];
}

export type ComputedScopes = Record<string, ComputedScope[]>;

const computedScopesList: ComputedScopes = {};

const registerComputedScopes = (scopes: ComputedScopes): void => {
  Object.assign(computedScopesList, scopes);
};

const getComputedScopes = (entity: string): ComputedScope[] => {
  return computedScopesList[entity] || [];
};

const getComputedScope = (entity: string, scopeId: string): ComputedScope | undefined => {
  return computedScopesList[entity]?.find((scope) => scope.id === scopeId);
};

const getComputedScopeTranslation = (scope: ComputedScope): string => {
  return scope.translation?.(locale.value) ?? scope.name ?? scope.id;
};

const getComputedScopeParameterTranslation = (parameter: ComputedScopeParameter): string => {
  return parameter.translation?.(locale.value) ?? parameter.name ?? parameter.id;
};

export { registerComputedScopes, getComputedScopes, getComputedScope, getComputedScopeTranslation, getComputedScopeParameterTranslation };
