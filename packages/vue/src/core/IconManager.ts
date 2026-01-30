export type IconName =
  | 'add'
  | 'add_filter'
  | 'add_value'
  | 'delete'
  | 'close'
  | 'previous'
  | 'next'
  | 'collapse'
  | 'down'
  | 'minus'
  | 'reset'
  | 'search'
  | 'confirm'
  | 'export'
  | 'columns'
  | 'paginated_list'
  | 'infinite_list';

export interface IconConfig {
  class?: string;
  component?: string;
  [key: string]: unknown;
}

export type IconList = Record<IconName, IconConfig | undefined>;

export const defaultIcons: IconList = {
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
  search: { class: 'qkit-icon qkit-icon-search', component: 'i' },
  confirm: { class: 'qkit-icon qkit-icon-check', component: 'i' },
  export: { class: 'qkit-icon qkit-icon-export', component: 'i' },
  columns: { class: 'qkit-icon qkit-icon-columns', component: 'i' },
  paginated_list: { class: 'qkit-icon qkit-icon-paginated-list', component: 'i' },
  infinite_list: { class: 'qkit-icon qkit-icon-infinite-list', component: 'i' },
};

const iconList = {} as IconList;

let iconComponent: string = 'i';
let iconPropName: string = 'class';

const registerIcons = (
  customIcons: Partial<IconList>,
  customComponent: string = 'i',
  customPropName: string = 'class'
): void => {
  Object.assign(iconList, customIcons);
  iconComponent = customComponent;
  iconPropName = customPropName;
};

const handler: ProxyHandler<IconList> = {
  get(obj: IconList, prop: string): unknown {
    return obj[prop as IconName];
  },
  set(): boolean {
    throw new Error('icons are read only');
  },
};

const icons = new Proxy(iconList, handler) as Readonly<IconList>;

export { registerIcons, icons, iconComponent, iconPropName };
