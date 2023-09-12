const iconList = {
  add: { class: 'qkit-icon qkit-icon-plus', component: 'i' },
  add_filter: { class: 'qkit-icon qkit-icon-plus', component: 'i' },
  add_value: { class: 'qkit-icon qkit-icon-plus', component: 'i' },
  delete: { class: 'qkit-icon qkit-icon-cross', component: 'i' },
  close: { class: 'qkit-icon qkit-icon-cross', component: 'i' },
  previous: { class: 'qkit-icon qkit-icon-double-arrow-left', component: 'i' },
  next: { class: 'qkit-icon qkit-icon-double-arrow-right', component: 'i' },
  collapse: { class: 'qkit-icon qkit-icon-arrow-down', component: 'i' },
  down: { class: 'qkit-icon qkit-icon-arrow-full-down', component: 'i' },
  minus: { class: 'qkit-icon qkit-icon-minus', component: 'i' },
  reset: { class: 'qkit-icon qkit-icon-refresh', component: 'i' },
  search: undefined,
  confirm: undefined,
  export: undefined,
  columns: undefined,
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
  set() {
    throw new Error('icons are read only');
  },
};

const icons = new Proxy(iconList, handler);

export { registerIcons, icons, iconComponent, iconPropName };
