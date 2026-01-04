const classList = {
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
  scope_parameters: 'qkit-scope-parameters',
  scope_parameter: 'qkit-scope-parameter',
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
  group_resume: 'qkit-group-resume',
  group_list: 'qkit-group-list',
  group_list_element: 'qkit-group-list-element qkit-grid-container-for-transition',
  operator: 'qkit-operator',
  collection: 'qkit-collection',
  collection_header: 'qkit-collection-header',
  collection_content_wrapper: 'qkit-collection-content-wrapper',
  collection_content: 'qkit-collection-content',
  collection_table: 'qkit-collection-table',
  collection_clickable_row: 'qkit-clickable-row',
  collection_cell: 'qkit-cell',
  collection_clickable_cell: 'qkit-cell qkit-btn',
  collection_actions: 'qkit-collection-actions',
  column_choices: 'qkit-column-choices',
  column_choice: 'qkit-column-choice',
  column_add: 'qkit-column-add',
  spinner: 'qkit-spinner',
  pagination: 'qkit-pagination',
  grid_container_for_transition: 'qkit-grid-container-for-transition',
};

const registerClasses = (custom) => {
  Object.assign(classList, custom);
};

const handler = {
  get(obj, prop) {
    return obj[prop];
  },
  set() {
    throw new Error('classes are read only');
  },
};

const classes = new Proxy(classList, handler);

export { registerClasses, classes };
