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
  | 'columns';

export interface IconConfig {
  class?: string;
  component?: string;
  [key: string]: unknown;
}

export type IconList = Record<IconName, IconConfig | undefined>;

const iconList: IconList = {
  add: undefined,
  add_filter: undefined,
  add_value: undefined,
  delete: undefined,
  close: undefined,
  previous: undefined,
  next: undefined,
  collapse: undefined,
  down: undefined,
  minus: undefined,
  reset: undefined,
  search: undefined,
  confirm: undefined,
  export: undefined,
  columns: undefined,
};

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
