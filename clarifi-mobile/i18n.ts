import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

// Import your translation files
import en from './locales/en.json';
import fr from './locales/fr.json';

const i18n = new I18n();

// Set the key-value pairs for the different languages you want to support.
i18n.translations = {
  en: en,
  fr: fr,
};

// Set the locale once at the beginning of your app.
const phoneLocale = Localization.getLocales()[0]?.languageTag || 'en'; // Get device locale, default to 'en'
i18n.locale = phoneLocale;

// When a value is missing from a language it'll fallback to another language with the key present.
i18n.enableFallback = true;
// To make this fallback E.g. to german define:
i18n.defaultLocale = 'en'; // Fallback to English if current language has missing keys

// Helper function for components to use
export const translate = (key: string, options?: any) => i18n.t(key, options);

export default i18n;

console.log(`i18n initialized with locale: ${i18n.locale}`);
