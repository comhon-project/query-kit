import { mount, type MountingOptions } from '@vue/test-utils';
import plugin from '@core/Plugin';
import {
  entitySchemaLoader,
  entityTranslationsLoader,
  enumSchemaLoader,
  enumTranslationsLoader,
} from '@tests/assets/SchemaLoader';

const defaultPluginOptions = {
  entitySchemaLoader,
  entityTranslationsLoader,
  enumSchemaLoader,
  enumTranslationsLoader,
  icons: 'default' as const,
};

export function mountWithPlugin(component: any, options: MountingOptions<any> = {}) {
  return mount(component, {
    ...options,
    global: {
      ...options.global,
      plugins: [[plugin, defaultPluginOptions], ...(options.global?.plugins ?? [])],
    },
  });
}
