
const classList = {
    modal: 'qkit-modal',
    modal_close_container: 'qkit-dialog-close-container',
    condition_choice_form: 'qkit-condition-choice-form',
    query_main: 'qkit-query-main',
    condition_container: 'qkit-condition-container',
    condition_header: 'qkit-condition-header',
    condition_error_container: 'qkit-condition-container',
    condition_input: 'qkit-input',
    condition_input_boolean: 'qkit-input-boolean',
    in_container: 'qkit-in-container',
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
    operator: 'qkit-operator'
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