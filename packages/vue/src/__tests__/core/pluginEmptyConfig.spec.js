import { describe, it, expect } from 'vitest';

import plugin from '@core/Plugin';
import { requester } from '@core/Requester';
import { icons } from '@core/IconManager';
import { classes } from '@core/ClassManager';
import { getComponent } from '@core/InputManager';
import { config } from '@config/config';
import BooleanInput from '@components/Common/BooleanInput.vue';
import SelectEnum from '@components/Common/SelectEnum.vue';
import DateTimeInput from '@components/Common/DateTimeInput.vue';
import { locale, fallback } from '@i18n/i18n';

const componentList = {
  string: 'text',
  html: 'text',
  integer: 'number',
  float: 'number',
  date: 'date',
  datetime: DateTimeInput,
  time: 'time',
  enum: SelectEnum,
  boolean: BooleanInput,
};
const appMock = {
  component: () => {},
};

describe('minimal plugin', () => {
  it('install', () => {
    expect(plugin).toBeDefined();
    expect(plugin.install).toBeDefined();
  });
  it('missing required config', () => {
    expect(() => plugin.install(appMock)).toThrowError('must have at least required configs');
    expect(() => plugin.install(appMock, { requester: 1 })).toThrowError(
      'invalid requester. it must be a function or an object containing a property "request" with a function value',
    );
    expect(() => plugin.install(appMock, { requester: {} })).toThrowError(
      'invalid requester. it must be a function or an object containing a property "request" with a function value',
    );
    expect(() => plugin.install(appMock, { requester: () => {} })).toThrowError(
      'entitySchemaLoader config is required',
    );
    expect(() => plugin.install(appMock, { requester: { request: () => {} }, entitySchemaLoader: 1 })).toThrowError(
      'invalid entity schema loader. it must be a function or an object containing a property "load" with a function value',
    );
    expect(() => plugin.install(appMock, { requester: { request: () => {} }, entitySchemaLoader: {} })).toThrowError(
      'invalid entity schema loader. it must be a function or an object containing a property "load" with a function value',
    );
  });
  it('minimal config', () => {
    expect(plugin).toBeDefined();
    const options = { requester: { request: () => {} }, entitySchemaLoader: () => {} };
    plugin.install(appMock, options);
    expect(locale.value).toBe('en');
    expect(fallback.value).toBe('en');
    expect(requester).toBe(options.requester);

    expect(config).toEqual({
      renderHtml: false,
    });
    expect(icons).toEqual({
      add: undefined,
      add_filter: undefined,
      add_value: undefined,
      delete: undefined,
      close: undefined,
      previous: undefined,
      next: undefined,
      collapse: undefined,
      sort: undefined,
      minus: undefined,
      reset: undefined,
      search: undefined,
      confirm: undefined,
      export: undefined,
      columns: undefined,
      loading: undefined,
    });
    expect(classes).toEqual({
      modal: 'qkit-modal',
      modal_header: 'qkit-modal-header',
      modal_body: 'qkit-modal-body',
      modal_footer: 'qkit-modal-footer',
      filter_picker: 'qkit-filter-picker',
      search: 'qkit-search',
      builder: 'qkit-builder',
      condition_or_scope: 'qkit-leaf-filter qkit-condition-or-scope',
      condition_or_scope_header: 'qkit-condition-or-scope-header',
      invalid_filter: 'qkit-leaf-filter qkit-invalid-filter',
      input: 'qkit-input',
      input_boolean: 'qkit-input-boolean',
      multi_input: 'qkit-multi-input',
      multi_input_list: 'qkit-multi-input-list',
      multi_input_list_item: 'qkit-multi-input-list-item',
      property_label: 'qkit-property-label',
      scope_parameters: 'qkit-scope-parameters',
      scope_parameter: 'qkit-scope-parameter',
      error_message: 'qkit-error-message',
      relationship_container: 'qkit-leaf-filter qkit-relationship-condition-container',
      relationship_queue: 'qkit-relationship-queue',
      relationship_queue_item: 'qkit-relationship-queue-item',
      btn: 'qkit-btn',
      btn_primary: 'qkit-btn qkit-btn-primary',
      btn_danger: 'qkit-btn qkit-btn-danger',
      group: 'qkit-group',
      group_header: 'qkit-group-header',
      group_actions: 'qkit-group-actions',
      group_summary: 'qkit-group-summary',
      group_list: 'qkit-group-list',
      group_list_item: 'qkit-group-list-item',
      operator: 'qkit-operator',
      collection: 'qkit-collection',
      collection_header: 'qkit-collection-header',
      collection_content: 'qkit-collection-content',
      collection_table: 'qkit-collection-table',
      collection_clickable_row: 'qkit-clickable-row',
      collection_cell: 'qkit-cell',
      collection_clickable_cell: 'qkit-cell qkit-btn',
      collection_actions: 'qkit-collection-actions',
      column_editor_list: 'qkit-column-editor-list',
      column_editor_list_item: 'qkit-column-editor-list-item',
      column_picker: 'qkit-column-picker',
      loading: 'qkit-loading',
      pagination: 'qkit-pagination',
      pagination_item: 'qkit-pagination-item',
      skip_link: 'qkit-skip-link',
      sr_only: 'qkit-sr-only',
    });
    for (const key in componentList) {
      if (Object.hasOwn(componentList, key)) {
        expect(getComponent({ type: key })).toBe(componentList[key]);
      }
    }
    expect(getComponent({ type: 'string', enum: 'gender' })).toEqual(SelectEnum);
  });
});
