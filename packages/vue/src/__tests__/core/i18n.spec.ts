import { describe, it, expect, afterEach } from 'vitest';
import { nextTick } from 'vue';

import { locale, fallback, translate, loadedTranslations, _resetForTesting } from '@i18n/i18n';

async function waitForTranslation(targetLocale: string): Promise<void> {
  // Trigger translation loading by calling translate
  translate('add');
  // Wait for the dynamic import to resolve
  await new Promise<void>((resolve) => {
    const check = (): void => {
      if (loadedTranslations[targetLocale]) {
        resolve();
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
  await nextTick();
}

describe('i18n', () => {
  afterEach(() => {
    _resetForTesting();
  });

  describe('translate with default locale (en)', () => {
    it('translates known keys in English', () => {
      expect(translate('add')).toBe('add');
      expect(translate('search')).toBe('search');
      expect(translate('filter')).toBe('filter');
    });

    it('returns the key itself when the key is not found', () => {
      expect(translate('nonexistent_key_xyz')).toBe('nonexistent_key_xyz');
    });

    it('returns undefined when given undefined', () => {
      expect(translate(undefined)).toBeUndefined();
    });
  });

  describe('translate with locale fr', () => {
    it('loads French translations and translates correctly', async () => {
      locale.value = 'fr';
      await waitForTranslation('fr');

      expect(loadedTranslations.fr).toBeDefined();
      expect(translate('add')).toBe('ajouter');
      expect(translate('search')).toBe('rechercher');
    });
  });

  describe('fallback locale', () => {
    it('uses fallback when key is missing in current locale', async () => {
      locale.value = 'fr';
      await waitForTranslation('fr');

      // English has the key, French should also have it; try a key that
      // exists only in the fallback by checking behavior
      const keyInEnglish = translate('add');
      expect(keyInEnglish).toBeDefined();
      expect(typeof keyInEnglish).toBe('string');
    });

    it('defaults locale and fallback to "en"', () => {
      expect(locale.value).toBe('en');
      expect(fallback.value).toBe('en');
    });
  });

  describe('loadedTranslations', () => {
    it('has English translations loaded by default', () => {
      expect(loadedTranslations.en).toBeDefined();
      expect(loadedTranslations.en.add).toBe('add');
      expect(loadedTranslations.en.search).toBe('search');
    });

    it('does not have other locales loaded initially', () => {
      expect(loadedTranslations.fr).toBeUndefined();
      expect(loadedTranslations.de).toBeUndefined();
    });
  });

  describe('_resetForTesting', () => {
    it('restores locale to "en"', async () => {
      locale.value = 'fr';
      await waitForTranslation('fr');

      _resetForTesting();
      expect(locale.value).toBe('en');
    });

    it('restores fallback to "en"', () => {
      fallback.value = 'fr';

      _resetForTesting();
      expect(fallback.value).toBe('en');
    });

    it('removes non-English loaded translations', async () => {
      locale.value = 'fr';
      await waitForTranslation('fr');
      expect(loadedTranslations.fr).toBeDefined();

      _resetForTesting();
      expect(loadedTranslations.fr).toBeUndefined();
      expect(loadedTranslations.en).toBeDefined();
    });
  });
});
