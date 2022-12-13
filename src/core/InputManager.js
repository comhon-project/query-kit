import BooleanInput from '../components/Common/BooleanInput.vue'

const componentList = {
    string: 'text',
    integer: 'number',
    float: 'number',
    date: 'date',
    datetime: 'datetime-local',
    time: 'time',
    enum: 'select',
    boolean: BooleanInput,
  };

const registerComponents = (custom) => {
    Object.assign(componentList, custom);
}

const getComponent = (type, enumeration) => {
    return componentList[type] && enumeration 
        ? componentList.enum 
        : (typeof componentList[type] != 'object' || componentList[type].render
            ? componentList[type] // string or vue component
            : componentList[type].component) // value is an object with component property that contain the component
}

const isUniqueComponentIn = (type) => {
    return componentList[type] && !componentList[type].render && componentList[type].unique == true;
}

export {
    registerComponents,
    getComponent,
    isUniqueComponentIn,
}