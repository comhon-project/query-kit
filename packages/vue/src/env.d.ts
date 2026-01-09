/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module '@i18n/locales/en' {
  const translations: Record<string, string>;
  export default translations;
}
