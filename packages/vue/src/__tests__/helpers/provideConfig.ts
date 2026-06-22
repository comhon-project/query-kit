import { filterBuilderConfigKey } from '@core/InjectionKeys';
import type { FilterBuilderConfig } from '@core/types';

export function defaultFilterBuilderConfig(overrides: Partial<FilterBuilderConfig> = {}): FilterBuilderConfig {
  return {
    displayOperator: true,
    userTimezone: 'UTC',
    requestTimezone: 'UTC',
    aliasInsensitiveLabels: false,
    ...overrides,
  };
}

export function builderConfigProvide(overrides: Partial<FilterBuilderConfig> = {}) {
  return {
    [filterBuilderConfigKey as symbol]: defaultFilterBuilderConfig(overrides),
  };
}
