import type { CollectionType, DisplayOperator } from '@core/types';

export interface Config {
  renderHtml: boolean;
  userTimezone: string;
  requestTimezone: string;
  limit: number | undefined;
  debounce: number;
  manual: boolean;
  allowReset: boolean;
  allowUndo: boolean;
  allowRedo: boolean;
  displayOperator: DisplayOperator;
  quickSort: boolean;
  displayCount: boolean;
  editColumns: boolean;
  allowedCollectionTypes: CollectionType[];
}

const defaults: Config = {
  renderHtml: false,
  userTimezone: 'UTC',
  requestTimezone: 'UTC',
  limit: undefined,
  debounce: 1000,
  manual: false,
  allowReset: true,
  allowUndo: true,
  allowRedo: true,
  displayOperator: true,
  quickSort: true,
  displayCount: true,
  editColumns: false,
  allowedCollectionTypes: ['pagination'],
};

const config: Config = { ...defaults };

function applyOptions(options: Partial<Config>): void {
  for (const key of Object.keys(defaults) as (keyof Config)[]) {
    if (options[key] !== undefined) {
      (config as unknown as Record<string, unknown>)[key] = options[key];
    }
  }
}

function _resetForTesting(): void {
  Object.assign(config, defaults);
}

export { config, applyOptions, _resetForTesting };
