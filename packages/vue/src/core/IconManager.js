
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
}

const registerIcons = (custom) => {
    Object.assign(iconList, custom);
}

const handler = {
    get(obj, prop) { return obj[prop] },
    set(obj, prop, value) { throw new Error('icons are read only') }
};

const icons = new Proxy(iconList, handler);

export {
    registerIcons,
    icons
}