import Enum from '../components/Common/Renderers/Enum.vue';
import Html from '../components/Common/Renderers/Html.vue';
import Boolean from '../components/Common/Renderers/Boolean.vue';
import Date from '../components/Common/Renderers/Date.vue';
import DateTime from '../components/Common/Renderers/DateTime.vue';
import Time from '../components/Common/Renderers/Time.vue';
import ForeignModel from '../components/Common/Renderers/ForeignModel.vue';
import Array from '../components/Common/Renderers/Array.vue';

const renderers = {
  string: null,
  integer: null,
  float: null,
  enum: Enum,
  html: Html,
  date: Date,
  datetime: DateTime,
  time: Time,
  boolean: Boolean,
  relationship: ForeignModel,
  array: Array,
};

const registerRenderers = (custom) => {
  Object.assign(renderers, custom);
};

const getRenderer = (type, enumeration) => {
  return enumeration ? renderers.enum : renderers[type] || null;
};

export { registerRenderers, getRenderer };
