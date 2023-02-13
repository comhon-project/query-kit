const iconList = {
  add: undefined,
  add_filter: undefined,
  add_value: undefined,
  delete: undefined,
  search: undefined,
  reset: undefined,
  validate: undefined,
  close: undefined,
  previous: undefined,
  next: undefined,
  export: undefined,
};
let iconComponent = 'i';
let iconPropName = 'class';

const registerIcons = (customIcons, customComponent = 'i', customPropName = 'class') => {
  Object.assign(iconList, customIcons);
  iconComponent = customComponent;
  iconPropName = customPropName;
};

const handler = {
  get(obj, prop) {
    return obj[prop];
  },
  set(obj, prop, value) {
    throw new Error('icons are read only');
  },
};

const icons = new Proxy(iconList, handler);

export { registerIcons, icons, iconComponent, iconPropName };
