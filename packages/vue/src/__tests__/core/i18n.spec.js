import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { locale, translate, loadedTranslations } from '@i18n/i18n';

function waitForTranslation(targetLocale) {
  return new Promise((resolve) => {
    const check = () => {
      if (loadedTranslations[targetLocale]) {
        resolve();
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
}

describe('i18n', () => {
  it('translate with default locale', () => {
    expect(loadedTranslations.en.add).toBe('add');
    expect(loadedTranslations.en.search).toBe('search');
    expect(translate('add')).toBe('add');
    expect(translate('search')).toBe('search');
  });
  it('translate with locale fr', async () => {
    locale.value = 'fr';
    translate('add'); // trigger loading
    await waitForTranslation('fr');
    await nextTick();
    expect(loadedTranslations.fr.add).toBe('ajouter');
    expect(loadedTranslations.fr.search).toBe('rechercher');
    expect(translate('add')).toBe('ajouter');
    expect(translate('search')).toBe('rechercher');
  });
});
