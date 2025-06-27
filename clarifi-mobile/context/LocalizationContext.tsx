import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import { localizationService } from '../services/localization';

interface LocalizationContextType {
  currentLanguage: 'en' | 'fr';
  changeLanguage: (language: 'en' | 'fr') => Promise<void>;
  isInitialized: boolean;
  isChangingLanguage: boolean;
  availableLanguages: Array<{
    code: 'en' | 'fr';
    name: string;
    nativeName: string;
  }>;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatRelativeTime: (date: Date) => string;
  getLocalizedContent: (content: { en: string; fr: string }) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(
  undefined
);

interface LocalizationProviderProps {
  children: ReactNode;
}

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({
  children,
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'fr'>('en');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  useEffect(() => {
    const initializeLocalization = async () => {
      try {
        await localizationService.initialize();
        const language = localizationService.getCurrentLanguage();
        setCurrentLanguage(language);
        setIsInitialized(true);
        console.log(
          'Localization context initialized with language:',
          language
        );
      } catch (error) {
        console.error('Failed to initialize localization context:', error);
        // Set to initialized anyway with default language
        setIsInitialized(true);
      }
    };

    initializeLocalization();
  }, []);

  const changeLanguage = async (language: 'en' | 'fr') => {
    if (language === currentLanguage || isChangingLanguage) return;

    setIsChangingLanguage(true);
    try {
      await localizationService.changeLanguage(language);
      // Note: localizationService.changeLanguage() already handles i18n.changeLanguage() internally
      setCurrentLanguage(language);
      console.log('Language changed to:', language);
    } catch (error) {
      console.error('Failed to change language in context:', error);
      throw error;
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const contextValue: LocalizationContextType = {
    currentLanguage,
    changeLanguage,
    isInitialized,
    isChangingLanguage,
    availableLanguages: localizationService.getAvailableLanguages(),
    formatDate: (date, options) =>
      localizationService.formatDate(date, options),
    formatTime: (date, options) =>
      localizationService.formatTime(date, options),
    formatCurrency: (amount, currency) =>
      localizationService.formatCurrency(amount, currency),
    formatRelativeTime: date => localizationService.formatRelativeTime(date),
    getLocalizedContent: content =>
      localizationService.getLocalizedContent(content),
  };

  return (
    <LocalizationContext.Provider value={contextValue}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error(
      'useLocalization must be used within a LocalizationProvider'
    );
  }
  return context;
};

export default LocalizationContext;
