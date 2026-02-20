export type ClassName =
  | 'modal'
  | 'modal_header'
  | 'modal_body'
  | 'modal_footer'
  | 'filter_picker'
  | 'search'
  | 'builder'
  | 'condition_or_scope'
  | 'condition_or_scope_header'
  | 'invalid_filter'
  | 'input'
  | 'input_boolean'
  | 'multi_input'
  | 'multi_input_list'
  | 'multi_input_list_item'
  | 'property_label'
  | 'scope_parameters'
  | 'scope_parameter'
  | 'error_message'
  | 'relationship_container'
  | 'relationship_queue'
  | 'relationship_queue_item'
  | 'btn'
  | 'btn_primary'
  | 'btn_danger'
  | 'group'
  | 'group_header'
  | 'group_actions'
  | 'group_summary'
  | 'group_list'
  | 'group_list_item'
  | 'operator'
  | 'collection'
  | 'collection_header'
  | 'collection_content'
  | 'collection_table'
  | 'collection_clickable_row'
  | 'collection_cell'
  | 'collection_clickable_cell'
  | 'collection_actions'
  | 'column_editor_list'
  | 'column_editor_list_item'
  | 'column_picker'
  | 'loading'
  | 'pagination'
  | 'pagination_item'
  | 'skip_link'
  | 'sr_only';

export type ClassList = Record<ClassName, string>;

const classList: ClassList = {
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
