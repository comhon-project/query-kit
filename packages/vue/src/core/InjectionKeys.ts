import type { InjectionKey } from 'vue';
import type { FilterBuilderConfig } from '@core/types';

/**
 * Injection keys for provide/inject pattern.
 * Using Symbol ensures unique keys to avoid collisions when library is used as dependency.
 */
export const filterBuilderConfigKey: InjectionKey<FilterBuilderConfig> = Symbol('builderConfig');
