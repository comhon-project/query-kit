import locale from "./locales/fr";

const translate = (key) => {
    if (key == undefined) {
        return undefined;
    }
    return key.split('.').reduce((current, localeKey) => {
        if (current) {
            return current[localeKey];
        }
    }, locale)
}

export {
    translate
}