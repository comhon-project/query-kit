import type { InjectionKey } from 'vue';
import type { BuilderConfig } from '@core/types';

/**
 * Injection keys for provide/inject pattern.
 * Using Symbol ensures unique keys to avoid collisions when library is used as dependency.
 */
export const builderConfigKey: InjectionKey<BuilderConfig> = Symbol('builderConfig');
