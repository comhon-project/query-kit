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
    return enumeration ? componentList.enum : componentList[type];
}

export {
    registerComponents,
    getComponent,
}