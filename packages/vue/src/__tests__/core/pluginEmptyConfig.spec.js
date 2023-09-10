import { describe, it, expect } from 'vitest';

import plugin from '../../core/Plugin';
import { requester } from '../../core/Requester';
import { icons } from '../../core/IconManager';
import { classes } from '../../core/ClassManager';
import { getComponent } from '../../core/InputManager';
import { config } from '../../config/config';
import BooleanInput from '../../components/Common/BooleanInput.vue';
import { locale, fallback } from '../../i18n/i18n';

const componentList = {
  string: 'text',
  html: 'text',
  integer: 'number',
  float: 'number',
  date: 'date',
  datetime: 'datetime-local',
  time: 'time',
  enum: 'select',
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
    expect(() => plugin.install(appMock, {})).toThrowError('requester config is required');
    expect(() => plugin.install(appMock, { requester: 1 })).toThrowError(
      'invalid requester. it must be a function or an object containing a property "request" with a function value'
    );
    expect(() => plugin.install(appMock, { requester: {} })).toThrowError(
      'invalid requester. it must be a function or an object containing a property "request" with a function value'
    );
    expect(() => plugin.install(appMock, { requester: () => {} })).toThrowError('schemaLoader config is required');
    expect(() => plugin.install(appMock, { requester: { request: () => {} }, schemaLoader: 1 })).toThrowError(
      'invalid schema loader. it must be a function or an object containing a property "load" with a function value'
    );
    expect(() => plugin.install(appMock, { requester: { request: () => {} }, schemaLoader: {} })).toThrowError(
      'invalid schema loader. it must be a function or an object containing a property "load" with a function value'
    );
  });
  it('minimal config', () => {
    expect(plugin).toBeDefined();
    const options = { requester: { request: () => {} }, schemaLoader: { load: () => {} } };
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
      search: undefined,
      reset: undefined,
      validate: undefined,
      close: undefined,
      previous: undefined,
      next: undefined,
      export: undefined,
    });
    expect(classes).toEqual({
      modal: 'qkit-modal',
      modal_header: 'qkit-modal-header',
      modal_body: 'qkit-modal-body',
      modal_footer: 'qkit-modal-footer',
      condition_choice_form: 'qkit-condition-choice-form',
      search: 'qkit-search',
      builder: 'qkit-builder',
      condition_container: 'qkit-condition-container',
      condition_header: 'qkit-condition-header',
      condition_error_container: 'qkit-condition-container',
      input: 'qkit-input',
      input_boolean: 'qkit-input-boolean',
      in_container: 'qkit-in-container',
      in_list: 'qkit-in-list',
      in_value_container: 'qkit-in-value-container',
      property_name_container: 'qkit-property-name-container',
      error_info: 'qkit-error-info',
      relationship_container: 'qkit-condition-container',
      relationship_queue: 'qkit-relationship-queue',
      relationship_queue_and_action: 'qkit-relationship-queue-and-action',
      relationship_queue_element: 'qkit-relationship-queue-element',
      btn: 'qkit-btn',
      btn_primary: 'qkit-btn qkit-btn-primary',
      btn_secondary: 'qkit-btn qkit-btn-secondary',
      group: 'qkit-group',
      group_header: 'qkit-group-header',
      group_actions: 'qkit-group-actions',
      group_list: 'qkit-group-list',
      group_resume: 'qkit-group-resume',
      operator: 'qkit-operator',
      collection: 'qkit-collection',
      collection_header: 'qkit-collection-header',
      collection_content: 'qkit-collection-content',
      collection_content_wrapper: 'qkit-collection-content-wrapper',
      collection_table: 'qkit-collection-table',
      collection_clickable_row: 'qkit-clickable-row',
      collection_cell: 'qkit-cell',
      collection_clickable_cell: 'qkit-cell qkit-btn',
      collection_actions: 'qkit-collection-actions',
      order_asc: 'qkit-asc',
      order_desc: 'qkit-desc',
      active: 'qkit-active',
      spinner: 'qkit-spinner',
      pagination: 'qkit-pagination',
    });
    for (const key in componentList) {
      if (Object.hasOwnProperty.call(componentList, key)) {
        expect(getComponent(key)).toBe(componentList[key]);
      }
    }
    expect(getComponent('string', true)).toEqual('select');
  });
});
