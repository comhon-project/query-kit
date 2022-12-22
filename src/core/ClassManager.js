
const classList = {
    modal: 'qkit-modal',
    modal_close_container: 'qkit-dialog-close-container',
    condition_choice_form: 'qkit-condition-choice-form',
    search: 'qkit-search',
    builder: 'qkit-builder',
    condition_container: 'qkit-condition-container',
    condition_header: 'qkit-condition-header',
    condition_error_container: 'qkit-condition-container',
    condition_input: 'qkit-input',
    condition_input_boolean: 'qkit-input-boolean',
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
    operator: 'qkit-operator',
    collection: 'qkit-collection',
    collection_header: 'qkit-collection-header',
    collection_content: 'qkit-collection-content',
    collection_table: 'qkit-collection-table',
    collection_clickable_row: 'qkit-clickable-row',
    collection_cell: 'qkit-cell',
    collection_clickable_cell: 'qkit-cell qkit-btn',
    order_asc: 'qkit-asc',
    order_desc: 'qkit-desc',
    active: 'qkit-active',
    spinner: 'qkit-spinner',
    pagination: 'qkit-pagination',
}

const registerClasses = (custom) => {
    Object.assign(classList, custom);
}

const handler = {
    get(obj, prop) { return obj[prop] },
    set(obj, prop, value) { throw new Error('classes are read only') }
};

const classes = new Proxy(classList, handler);

export {
    registerClasses,
    classes
}