import Enum from '../components/Common/Renderers/Enum.vue';
import Html from '../components/Common/Renderers/Html.vue';
import Boolean from '../components/Common/Renderers/Boolean.vue';
import Date from '../components/Common/Renderers/Date.vue';
import DateTime from '../components/Common/Renderers/DateTime.vue';
import Time from '../components/Common/Renderers/Time.vue';
import ForeignModel from '../components/Common/Renderers/ForeignModel.vue';

const componentList = {
  string: 'raw',
  integer: 'raw',
  float: 'raw',
  enum: Enum,
  html: Html,
  date: Date,
  datetime: DateTime,
  time: Time,
  boolean: Boolean,
  relationship: ForeignModel,
};

const registerComponents = (custom) => {
  Object.assign(componentList, custom);
};

const getComponent = (type, enumeration) => {
  return componentList[type] && enumeration ? componentList.enum : componentList[type] || 'raw';
};

export { registerComponents, getComponent };
