import { builderConfigKey } from '@core/InjectionKeys';

export function builderConfigProvide(overrides: Record<string, unknown> = {}) {
  return {
    [builderConfigKey as symbol]: {
      displayOperator: true,
      userTimezone: 'UTC',
      requestTimezone: 'UTC',
      ...overrides,
    },
  };
}
