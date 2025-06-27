import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation files
import en from '../../locales/en.json';
import fr from '../../locales/fr.json';

// Import storage utilities
import { getString, storeString, STORAGE_KEYS } from '../storage';

/**
 * Initialize i18next for react-i18next usage
 */
const initI18next = async () => {
  // Get device locale
  const deviceLocale = Localization.getLocales()[0]?.languageTag || 'en';
  const languageCode = deviceLocale.split('-')[0]; // Extract language code (e.g., 'en' from 'en-CA')

  // Get stored language preference or use device locale
  const storedLanguage = await getString(
    STORAGE_KEYS.EDUCATION_PREFERRED_LANGUAGE
  );
  const initialLanguage =
    storedLanguage || (languageCode === 'fr' ? 'fr' : 'en');

  await i18next.use(initReactI18next).init({
    compatibilityJSON: 'v3',
    lng: initialLanguage,
    fallbackLng: 'en',
    debug: __DEV__,

    // Resources
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Key separator (allow nested keys like 'education.hub.title')
    keySeparator: '.',

    // Namespace separator
    nsSeparator: false,

    // React options
    react: {
      useSuspense: false,
    },
  });

  return i18next;
};

/**
 * Localization service for the education system
 */
class LocalizationService {
  private initialized = false;

  /**
   * Initialize the localization service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await initI18next();
      this.initialized = true;
      console.log(`i18next initialized with language: ${i18next.language}`);
    } catch (error) {
      console.error('Failed to initialize i18next:', error);
      throw error;
    }
  }

  /**
   * Change the application language
   */
  async changeLanguage(languageCode: 'en' | 'fr'): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      await i18next.changeLanguage(languageCode);
      await storeString(
        STORAGE_KEYS.EDUCATION_PREFERRED_LANGUAGE,
        languageCode
      );
      console.log(`Language changed to: ${languageCode}`);
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    }
  }

  /**
   * Get the current language
   */
  getCurrentLanguage(): 'en' | 'fr' {
    return (i18next.language?.startsWith('fr') ? 'fr' : 'en') as 'en' | 'fr';
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): Array<{
    code: 'en' | 'fr';
    name: string;
    nativeName: string;
  }> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
    ];
  }

  /**
   * Translate a key using the current language
   */
  translate(key: string, options?: any): string {
    if (!this.initialized) {
      console.warn('LocalizationService not initialized, returning key');
      return key;
    }
    return i18next.t(key, options);
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get localized content based on current language
   */
  getLocalizedContent(content: { en: string; fr: string }): string {
    const currentLang = this.getCurrentLanguage();
    return content[currentLang] || content.en;
  }

  /**
   * Format date according to current locale
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const currentLang = this.getCurrentLanguage();
    const locale = currentLang === 'fr' ? 'fr-CA' : 'en-CA';

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return date.toLocaleDateString(locale, { ...defaultOptions, ...options });
  }

  /**
   * Format time according to current locale
   */
  formatTime(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const currentLang = this.getCurrentLanguage();
    const locale = currentLang === 'fr' ? 'fr-CA' : 'en-CA';

    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };

    return date.toLocaleTimeString(locale, { ...defaultOptions, ...options });
  }

  /**
   * Format numbers according to current locale
   */
  formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    const currentLang = this.getCurrentLanguage();
    const locale = currentLang === 'fr' ? 'fr-CA' : 'en-CA';

    return number.toLocaleString(locale, options);
  }

  /**
   * Format currency according to current locale
   */
  formatCurrency(amount: number, currency = 'CAD'): string {
    const currentLang = this.getCurrentLanguage();
    const locale = currentLang === 'fr' ? 'fr-CA' : 'en-CA';

    return amount.toLocaleString(locale, {
      style: 'currency',
      currency,
    });
  }

  /**
   * Get relative time format (e.g., "2 hours ago")
   */
  formatRelativeTime(date: Date): string {
    const currentLang = this.getCurrentLanguage();
    const locale = currentLang === 'fr' ? 'fr-CA' : 'en-CA';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return this.translate('common.justNow') || 'Just now';
    }

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return rtf.format(-minutes, 'minute');
    }

    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return rtf.format(-hours, 'hour');
    }

    const days = Math.floor(diffInSeconds / 86400);
    if (days < 30) {
      return rtf.format(-days, 'day');
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
      return rtf.format(-months, 'month');
    }

    const years = Math.floor(months / 12);
    return rtf.format(-years, 'year');
  }

  /**
   * Detect if the current language is RTL (not applicable for EN/FR but useful for future)
   */
  isRTL(): boolean {
    // Neither English nor French are RTL languages
    return false;
  }

  /**
   * Get text direction for current language
   */
  getTextDirection(): 'ltr' | 'rtl' {
    return this.isRTL() ? 'rtl' : 'ltr';
  }
}

// Export singleton instance
export const localizationService = new LocalizationService();
export default localizationService;

// Also export i18next instance for direct use with useTranslation hook
export { i18next };

// Helper functions for backward compatibility
export const t = (key: string, options?: any) =>
  localizationService.translate(key, options);
export const changeLanguage = (lang: 'en' | 'fr') =>
  localizationService.changeLanguage(lang);
export const getCurrentLanguage = () =>
  localizationService.getCurrentLanguage();
