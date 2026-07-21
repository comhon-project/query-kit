import type {
  CollectionType,
  DisplayOperator,
  FilterEditingLocation,
  FieldsEditingLocation,
  SortEditingLocation,
} from '@core/types';

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
  displayCount: boolean;
  filterEditingLocation: FilterEditingLocation;
  fieldsEditingLocation: FieldsEditingLocation;
  sortEditingLocation: SortEditingLocation;
  naturalSortWhenEmpty: boolean;
  allowedCollectionTypes: CollectionType[];
  aliasInsensitiveLabels: boolean;
  reflow: boolean;
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
  displayCount: true,
  filterEditingLocation: 'query-builder',
  fieldsEditingLocation: 'none',
  sortEditingLocation: 'collection-column',
  naturalSortWhenEmpty: false,
  allowedCollectionTypes: ['pagination'],
  aliasInsensitiveLabels: false,
  reflow: false,
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
