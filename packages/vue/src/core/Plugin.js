import { locale, fallback } from '@i18n/i18n';
import { registerClasses } from '@core/ClassManager';
import { registerIcons } from '@core/IconManager';
import { registerComponents } from '@core/InputManager';
import { registerPropertyRenderers, registerTypeRenderers } from '@core/CellRendererManager';
import {
  registerLoader as registerEntitySchemaLoader,
  registerTranslationsLoader as registerEntityTranslationsLoader,
} from '@core/EntitySchema';
import {
  registerLoader as registerEnumSchemaLoader,
  registerTranslationsLoader as registerEnumTranslationsLoader,
} from '@core/EnumSchema';
import { registerLoader as registerRequestSchemaLoader } from '@core/RequestSchema';
import { config } from '@config/config';
import { registerRequester } from '@core/Requester';
import { registerAllowedOperators } from '@core/OperatorManager';

import Search from '@components/Search.vue';
import Builder from '@components/Filter/Builder.vue';
import Collection from '@components/Collection/Collection.vue';

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
    if (options.cellTypeRenderers) {
      registerTypeRenderers(options.cellTypeRenderers);
    }
    if (options.cellPropertyRenderers) {
      registerPropertyRenderers(options.cellPropertyRenderers);
    }
    if (options.defaultLocale) {
      locale.value = options.defaultLocale;
    }
    if (options.fallbackLocale) {
      fallback.value = options.fallbackLocale;
    }
    if (options.allowedOperators) {
      registerAllowedOperators(options.allowedOperators);
    }
    if (options.requester) {
      const requester = typeof options.requester == 'function' ? { request: options.requester } : options.requester;
      if (typeof requester != 'object' || typeof requester.request != 'function') {
        throw new Error(
          'invalid requester. it must be a function or an object containing a property "request" with a function value',
        );
      }
      registerRequester(requester);
    }
    if (options.entitySchemaLoader) {
      const loader =
        typeof options.entitySchemaLoader == 'function'
          ? { load: options.entitySchemaLoader }
          : options.entitySchemaLoader;
      if (typeof loader != 'object' || typeof loader.load != 'function') {
        throw new Error(
          'invalid entity schema loader. it must be a function or an object containing a property "load" with a function value',
        );
      }
      registerEntitySchemaLoader(loader);
    } else {
      throw new Error('entitySchemaLoader config is required');
    }
    if (options.entityTranslationsLoader) {
      const translationsLoader =
        typeof options.entityTranslationsLoader == 'function'
          ? { load: options.entityTranslationsLoader }
          : options.entityTranslationsLoader;
      if (typeof translationsLoader != 'object' || typeof translationsLoader.load != 'function') {
        throw new Error(
          'invalid entity translations loader. it must be a function or an object containing a property "load" with a function value',
        );
      }
      registerEntityTranslationsLoader(translationsLoader);
    }
    if (options.enumSchemaLoader) {
      const loader =
        typeof options.enumSchemaLoader == 'function' ? { load: options.enumSchemaLoader } : options.enumSchemaLoader;
      if (typeof loader != 'object' || typeof loader.load != 'function') {
        throw new Error(
          'invalid enum schema loader. it must be a function or an object containing a property "load" with a function value',
        );
      }
      registerEnumSchemaLoader(loader);
    }
    if (options.enumTranslationsLoader) {
      const translationsLoader =
        typeof options.enumTranslationsLoader == 'function'
          ? { load: options.enumTranslationsLoader }
          : options.enumTranslationsLoader;
      if (typeof translationsLoader != 'object' || typeof translationsLoader.load != 'function') {
        throw new Error(
          'invalid enum translations loader. it must be a function or an object containing a property "load" with a function value',
        );
      }
      registerEnumTranslationsLoader(translationsLoader);
    }
    if (options.requestSchemaLoader) {
      const loader =
        typeof options.requestSchemaLoader == 'function'
          ? { load: options.requestSchemaLoader }
          : options.requestSchemaLoader;
      if (typeof loader != 'object' || typeof loader.load != 'function') {
        throw new Error(
          'invalid request schema loader. it must be a function or an object containing a property "load" with a function value',
        );
      }
      registerRequestSchemaLoader(loader);
    }

    for (const key in config) {
      if (Object.hasOwn(config, key) && Object.hasOwn(options, key)) {
        config[key] = options[key];
      }
    }

    app.component('QkitSearch', Search);
    app.component('QkitCollection', Collection);
    app.component('QkitBuilder', Builder);
  },
};
