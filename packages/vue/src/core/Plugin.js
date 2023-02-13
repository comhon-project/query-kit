import { locale, fallback } from '../i18n/i18n';
import { registerClasses } from './ClassManager';
import { registerIcons } from './IconManager';
import { registerComponents } from './InputManager';
import { registerLoader, registerLocaleLoader } from './Schema';
import { config } from '../config/config';
import { registerRequester } from './Requester';

export default {
  install: (app, options) => {
    if (!options) {
      throw new Error('must have at least required configs');
    }
    if (options.icons) {
      registerIcons(options.icons, options.iconComponent, options.iconPropName);
    }
    if (options.classes) {
      registerClasses(options.classes);
    }
    if (options.inputs) {
      registerComponents(options.inputs);
    }
    if (options.defaultLocale) {
      locale.value = options.defaultLocale;
    }
    if (options.fallbackLocale) {
      fallback.value = options.fallbackLocale;
    }
    if (options.requester) {
      const requester = typeof options.requester == 'function' ? { request: options.requester } : options.requester;
      if (typeof requester != 'object' || typeof requester.request != 'function') {
        throw new Error(
          'invalid requester. it must be a function or an object containing a property "request" with a function value'
        );
      }
      registerRequester(requester);
    } else {
      throw new Error('requester config is required');
    }
    if (options.schemaLoader) {
      const loader = typeof options.schemaLoader == 'function' ? { load: options.schemaLoader } : options.schemaLoader;
      if (typeof loader != 'object' || typeof loader.load != 'function') {
        throw new Error(
          'invalid schema loader. it must be a function or an object containing a property "load" with a function value'
        );
      }
      registerLoader(loader);
    } else {
      throw new Error('schemaLoader config is required');
    }
    if (options.schemaLocaleLoader) {
      const localeLoader =
        typeof options.schemaLocaleLoader == 'function'
          ? { load: options.schemaLocaleLoader }
          : options.schemaLocaleLoader;
      if (typeof localeLoader != 'object' || typeof localeLoader.load != 'function') {
        throw new Error(
          'invalid schema locale loader. it must be a function or an object containing a property "load" with a function value'
        );
      }
      registerLocaleLoader(localeLoader);
    }

    for (const key in config) {
      if (Object.hasOwnProperty.call(config, key) && Object.hasOwnProperty.call(options, key)) {
        config[key] = options[key];
      }
    }
  },
};
