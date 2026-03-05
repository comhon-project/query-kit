import { builderConfigKey } from '@core/InjectionKeys';
import type { BuilderConfig } from '@core/types';

export function defaultBuilderConfig(overrides: Partial<BuilderConfig> = {}): BuilderConfig {
  return {
    displayOperator: true,
    userTimezone: 'UTC',
    requestTimezone: 'UTC',
    allowReset: true,
    allowUndo: true,
    allowRedo: true,
    debounce: 1000,
    manual: false,
    ...overrides,
  };
}

export function builderConfigProvide(overrides: Partial<BuilderConfig> = {}) {
  return {
    [builderConfigKey as symbol]: defaultBuilderConfig(overrides),
  };
}
