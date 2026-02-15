export type ClassName =
  | 'modal'
  | 'modal_header'
  | 'modal_body'
  | 'modal_footer'
  | 'condition_choice_form'
  | 'search'
  | 'builder'
  | 'condition_container'
  | 'condition_header'
  | 'condition_error_container'
  | 'input'
  | 'input_boolean'
  | 'in_container'
  | 'in_list'
  | 'in_value_container'
  | 'property_name_container'
  | 'scope_parameters'
  | 'scope_parameter'
  | 'error_info'
  | 'relationship_container'
  | 'relationship_queue'
  | 'relationship_queue_and_action'
  | 'relationship_queue_element'
  | 'btn'
  | 'btn_primary'
  | 'btn_danger'
  | 'group'
  | 'group_header'
  | 'group_actions'
  | 'group_summary'
  | 'group_list'
  | 'group_list_element'
  | 'operator'
  | 'collection'
  | 'collection_header'
  | 'collection_content_wrapper'
  | 'collection_content'
  | 'collection_table'
  | 'collection_clickable_row'
  | 'collection_cell'
  | 'collection_clickable_cell'
  | 'collection_actions'
  | 'column_choices'
  | 'column_choice'
  | 'column_add'
  | 'spinner'
  | 'pagination'
  | 'grid_container_for_transition'
  | 'skip_link'
  | 'sr_only';

export type ClassList = Record<ClassName, string>;

const classList: ClassList = {
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
  btn_danger: 'qkit-btn qkit-btn-danger',
  group: 'qkit-group',
  group_header: 'qkit-group-header',
  group_actions: 'qkit-group-actions',
  group_summary: 'qkit-group-summary',
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
  skip_link: 'qkit-skip-link',
  sr_only: 'qkit-sr-only',
};

const registerClasses = (custom: Partial<ClassList>): void => {
  Object.assign(classList, custom);
};

const handler: ProxyHandler<ClassList> = {
  get(obj: ClassList, prop: string): string {
    return obj[prop as ClassName];
  },
  set(): boolean {
    throw new Error('classes are read only');
  },
};

const classes = new Proxy(classList, handler) as Readonly<ClassList>;

export { registerClasses, classes };
