import Enum from '@components/Common/Renderers/Enum.vue';
import Html from '@components/Common/Renderers/Html.vue';
import Boolean from '@components/Common/Renderers/Boolean.vue';
import Date from '@components/Common/Renderers/Date.vue';
import DateTime from '@components/Common/Renderers/DateTime.vue';
import Time from '@components/Common/Renderers/Time.vue';
import ForeignEntity from '@components/Common/Renderers/ForeignEntity.vue';
import Array from '@components/Common/Renderers/Array.vue';

const typeRenderers = {
  string: null,
  integer: null,
  float: null,
  enum: Enum,
  html: Html,
  date: Date,
  datetime: DateTime,
  time: Time,
  boolean: Boolean,
  relationship: ForeignEntity,
  array: Array,
};

const propertyRenderers = {};

const registerTypeRenderers = (custom) => {
  Object.assign(typeRenderers, custom);
};

const registerPropertyRenderers = (custom) => {
  Object.assign(propertyRenderers, custom);
};

const getTypeRenderer = (typeContainer) => {
  return typeContainer.enum ? typeRenderers.enum : typeRenderers[typeContainer.type] || null;
};

const getPropertyRenderer = (property) => {
  return propertyRenderers[property.owner]?.[property.id] ?? getTypeRenderer(property);
};

export { registerTypeRenderers, registerPropertyRenderers, getPropertyRenderer, getTypeRenderer };
