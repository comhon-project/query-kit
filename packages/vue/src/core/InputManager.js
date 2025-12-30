import BooleanInput from '@components/Common/BooleanInput.vue';

const nativeHtmlComponents = {
  // input types
  button: true,
  checkbox: true,
  color: true,
  date: true,
  'datetime-local': true,
  email: true,
  file: true,
  hidden: true,
  image: true,
  month: true,
  number: true,
  password: true,
  radio: true,
  range: true,
  reset: true,
  search: true,
  submit: true,
  tel: true,
  text: true,
  time: true,
  url: true,
  week: true,
  // tags
  textarea: true,
  select: true,
};

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

const registerComponents = (custom) => {
  Object.assign(componentList, custom);
};

const getComponent = (type, enumeration) => {
  return componentList[type] && enumeration
    ? componentList.enum
    : typeof componentList[type] != 'object' || componentList[type].render // if there is render method it's a Vue component
    ? componentList[type] // the component is directly defined
    : componentList[type].component; // the component is encapsulted
};

const isUniqueComponentIn = (type) => {
  return componentList[type] && !componentList[type].render && componentList[type].unique == true;
};

const isNativeHtmlComponent = (component) => nativeHtmlComponents[component];

export { registerComponents, getComponent, isUniqueComponentIn, isNativeHtmlComponent };
