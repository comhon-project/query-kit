import type { Scope } from '@core/EntitySchema';

export interface ComputedScope extends Scope {
  computed?: (parameters: unknown[]) => Record<string, unknown>;
  translation?: (locale: string) => string;
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

export { registerComputedScopes, getComputedScopes, getComputedScope };
