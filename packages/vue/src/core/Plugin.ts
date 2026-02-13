import type { App } from 'vue';
import { locale, fallback } from '@i18n/i18n';
import { registerClasses, type ClassList } from '@core/ClassManager';
import { registerIcons, defaultIcons, type IconList } from '@core/IconManager';
import { registerComponents, type ComponentList } from '@core/InputManager';
import {
  registerPropertyRenderers,
  registerTypeRenderers,
  type TypeRenderers,
  type PropertyRenderers,
} from '@core/CellRendererManager';
import {
  registerLoader as registerEntitySchemaLoader,
  registerTranslationsLoader as registerEntityTranslationsLoader,
  type EntitySchemaLoader,
  type EntityTranslationsLoader,
  type RawEntitySchema,
  type EntityTranslations,
} from '@core/EntitySchema';
import {
  registerLoader as registerEnumSchemaLoader,
  registerTranslationsLoader as registerEnumTranslationsLoader,
  type EnumSchemaLoader,
  type EnumTranslationsLoader,
  type RawEnumSchema,
} from '@core/EnumSchema';
import {
  registerLoader as registerRequestSchemaLoader,
  type SchemaLoader as RequestSchemaLoader,
  type RequestSchema,
} from '@core/RequestSchema';
import { applyOptions } from '@config/config';
import { registerRequester, type Requester, type RequestParams, type RequestResponse } from '@core/Requester';
import { registerOperators, type AllowedOperators } from '@core/OperatorManager';
import { registerComputedScopes, type ComputedScopes } from '@core/ComputedScopesManager';

import Search from '@components/Search.vue';
import Builder from '@components/Filter/Builder.vue';
import Collection from '@components/Collection/Collection.vue';

type EntitySchemaLoaderFunction = (id: string) => Promise<RawEntitySchema | null>;
type EntityTranslationsLoaderFunction = (id: string, locale: string) => Promise<EntityTranslations | null>;
type EnumSchemaLoaderFunction = (id: string) => Promise<RawEnumSchema | null>;
type EnumTranslationsLoaderFunction = (id: string, locale: string) => Promise<Record<string, string> | null>;
type RequestSchemaLoaderFunction = (id: string) => Promise<RequestSchema | null>;
type RequesterFunction = (params: RequestParams) => Promise<RequestResponse>;

export interface PluginOptions {
  entitySchemaLoader: EntitySchemaLoader | EntitySchemaLoaderFunction;
  entityTranslationsLoader?: EntityTranslationsLoader | EntityTranslationsLoaderFunction;
  enumSchemaLoader?: EnumSchemaLoader | EnumSchemaLoaderFunction;
  enumTranslationsLoader?: EnumTranslationsLoader | EnumTranslationsLoaderFunction;
  requestSchemaLoader?: RequestSchemaLoader | RequestSchemaLoaderFunction;
  icons?: Partial<IconList> | 'default';
  iconComponent?: string;
  iconPropName?: string;
  classes?: Partial<ClassList>;
  inputs?: Partial<ComponentList>;
  cellTypeRenderers?: TypeRenderers;
  cellPropertyRenderers?: PropertyRenderers;
  defaultLocale?: string;
  fallbackLocale?: string;
  operators?: AllowedOperators;
  computedScopes?: ComputedScopes;
  requester?: Requester | RequesterFunction;
  renderHtml?: boolean;
}

export default {
  install: (app: App, options: PluginOptions): void => {
    if (!options) {
      throw new Error('must have at least required configs');
    }
    if (options.icons) {
      options.icons === 'default'
        ? registerIcons(defaultIcons)
        : registerIcons(options.icons, options.iconComponent, options.iconPropName);
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
    if (options.operators) {
      registerOperators(options.operators);
    }
    if (options.computedScopes) {
      registerComputedScopes(options.computedScopes);
    }
    if (options.requester) {
      const requester: Requester =
        typeof options.requester === 'function' ? { request: options.requester } : options.requester;
      if (typeof requester !== 'object' || typeof requester.request !== 'function') {
        throw new Error(
          'invalid requester. it must be a function or an object containing a property "request" with a function value',
        );
      }
      registerRequester(requester);
    }
    if (options.entitySchemaLoader) {
      const loader =
        typeof options.entitySchemaLoader === 'function'
          ? { load: options.entitySchemaLoader }
          : options.entitySchemaLoader;
      if (typeof loader !== 'object' || typeof loader.load !== 'function') {
        throw new Error(
          'invalid entity schema loader. it must be a function or an object containing a property "load" with a function value',
        );
      }
      registerEntitySchemaLoader(loader as EntitySchemaLoader);
    } else {
      throw new Error('entitySchemaLoader config is required');
    }
    if (options.entityTranslationsLoader) {
      const translationsLoader =
        typeof options.entityTranslationsLoader === 'function'
          ? { load: options.entityTranslationsLoader }
          : options.entityTranslationsLoader;
      if (typeof translationsLoader !== 'object' || typeof translationsLoader.load !== 'function') {
        throw new Error(
          'invalid entity translations loader. it must be a function or an object containing a property "load" with a function value',
        );
      }
      registerEntityTranslationsLoader(translationsLoader as EntityTranslationsLoader);
    }
    if (options.enumSchemaLoader) {
      const loader =
        typeof options.enumSchemaLoader === 'function' ? { load: options.enumSchemaLoader } : options.enumSchemaLoader;
      if (typeof loader !== 'object' || typeof loader.load !== 'function') {
        throw new Error(
          'invalid enum schema loader. it must be a function or an object containing a property "load" with a function value',
        );
      }
      registerEnumSchemaLoader(loader as EnumSchemaLoader);
    }
    if (options.enumTranslationsLoader) {
      const translationsLoader =
        typeof options.enumTranslationsLoader === 'function'
          ? { load: options.enumTranslationsLoader }
          : options.enumTranslationsLoader;
      if (typeof translationsLoader !== 'object' || typeof translationsLoader.load !== 'function') {
        throw new Error(
          'invalid enum translations loader. it must be a function or an object containing a property "load" with a function value',
        );
      }
      registerEnumTranslationsLoader(translationsLoader as EnumTranslationsLoader);
    }
    if (options.requestSchemaLoader) {
      const loader =
        typeof options.requestSchemaLoader === 'function'
          ? { load: options.requestSchemaLoader }
          : options.requestSchemaLoader;
      if (typeof loader !== 'object' || typeof loader.load !== 'function') {
        throw new Error(
          'invalid request schema loader. it must be a function or an object containing a property "load" with a function value',
        );
      }
      registerRequestSchemaLoader(loader as RequestSchemaLoader);
    }

    applyOptions(options);

    app.component('QkitSearch', Search);
    app.component('QkitCollection', Collection);
    app.component('QkitBuilder', Builder);
  },
};
