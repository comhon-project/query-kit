import { describe, it, expect, beforeAll } from 'vitest'
import { locale, translate, translations } from '../../i18n/i18n';

beforeAll(() => {
  translate('add');
  translate('search');
});

describe('i18n', () => {
  it('translate with default locale', () => {
    expect(translations.value.add).toBe('add');
    expect(translations.value.search).toBe('search');
    expect(translate('add')).toBe('add');
    expect(translate('search')).toBe('search');
  });
  it('translate with locale fr', async () => {
    locale.value = 'fr';
    await new Promise(resolve => {
      setTimeout(() => {
        expect(translations.value.add).toBe('ajouter');
        expect(translations.value.search).toBe('rechercher');
        expect(translate('add')).toBe('ajouter');
        expect(translate('search')).toBe('rechercher');
        resolve();
      }, 10);
    });
  });
})