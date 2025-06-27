import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors } from '../../constants/colors';
import { localizationService } from '../../services/localization';
import { educationService } from '../../services/education/educationService';

interface LanguageSelectorProps {
  compact?: boolean;
  showTitle?: boolean;
  onLanguageChange?: (language: 'en' | 'fr') => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  compact = false,
  showTitle = true,
  onLanguageChange,
}) => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'fr'>('en');
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    // Initialize and get current language
    const initializeLanguage = async () => {
      try {
        await localizationService.initialize();
        const currentLang = localizationService.getCurrentLanguage();
        setCurrentLanguage(currentLang);
      } catch (error) {
        console.error('Failed to initialize localization service:', error);
      }
    };

    initializeLanguage();
  }, []);

  const handleLanguageChange = async (newLanguage: 'en' | 'fr') => {
    if (newLanguage === currentLanguage || isChanging) return;

    setIsChanging(true);
    try {
      // Change language in localization service
      await localizationService.changeLanguage(newLanguage);

      // Change language in education service
      await educationService.setPreferredLanguage(newLanguage);

      // Update i18next for react-i18next components
      await i18n.changeLanguage(newLanguage);

      setCurrentLanguage(newLanguage);

      // Call callback if provided
      if (onLanguageChange) {
        onLanguageChange(newLanguage);
      }

      // Show success message
      const languageName = newLanguage === 'en' ? 'English' : 'Français';
      Alert.alert(
        t('education.settings.changeLanguage'),
        t('education.settings.languageChanged', { language: languageName })
      );
    } catch (error) {
      console.error('Failed to change language:', error);
      Alert.alert(t('common.error'), t('education.errors.languageChange'));
    } finally {
      setIsChanging(false);
    }
  };

  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇨🇦' },
    { code: 'fr' as const, name: 'Français', flag: '🇨🇦' },
  ];

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {languages.map(language => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.compactLanguageButton,
              {
                backgroundColor:
                  currentLanguage === language.code
                    ? colors.primary
                    : colors.backgroundOffset,
              },
            ]}
            onPress={() => handleLanguageChange(language.code)}
            disabled={isChanging}
            accessibilityRole="button"
            accessibilityLabel={`${language.name}${currentLanguage === language.code ? ' (currently selected)' : ''}`}
            accessibilityHint={`Switch app language to ${language.name}`}
          >
            <Text
              style={[
                styles.compactLanguageText,
                {
                  color:
                    currentLanguage === language.code
                      ? colors.white
                      : colors.textPrimary,
                },
              ]}
            >
              {language.name}
            </Text>
            {currentLanguage === language.code && (
              <Ionicons
                name="checkmark"
                size={16}
                color={colors.white}
                style={styles.checkIcon}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.backgroundSecondary },
      ]}
    >
      {showTitle && (
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('education.settings.language')}
        </Text>
      )}

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t('education.settings.selectLanguage')}
      </Text>

      <View style={styles.languageOptions}>
        {languages.map(language => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageOption,
              {
                backgroundColor: colors.backgroundOffset,
                borderColor:
                  currentLanguage === language.code
                    ? colors.primary
                    : colors.borderLight,
                borderWidth: currentLanguage === language.code ? 2 : 1,
              },
            ]}
            onPress={() => handleLanguageChange(language.code)}
            disabled={isChanging}
            accessibilityRole="button"
            accessibilityLabel={`${language.name}${currentLanguage === language.code ? ' (currently selected)' : ''}`}
            accessibilityHint={`Switch app language to ${language.name}`}
          >
            <View style={styles.languageContent}>
              <View style={styles.languageInfo}>
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <View style={styles.languageTexts}>
                  <Text
                    style={[styles.languageName, { color: colors.textPrimary }]}
                  >
                    {language.name}
                  </Text>
                  <Text
                    style={[
                      styles.languageCode,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {language.code.toUpperCase()}
                  </Text>
                </View>
              </View>

              {currentLanguage === language.code ? (
                <View
                  style={[
                    styles.selectedIndicator,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons name="checkmark" size={20} color={colors.white} />
                </View>
              ) : (
                <View
                  style={[
                    styles.unselectedIndicator,
                    { borderColor: colors.borderLight },
                  ]}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {isChanging && (
        <View style={styles.changingIndicator}>
          <Text style={[styles.changingText, { color: colors.textSecondary }]}>
            {t('common.loading')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  compactLanguageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  compactLanguageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  languageOptions: {
    gap: 12,
  },
  languageOption: {
    borderRadius: 12,
    padding: 16,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageTexts: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  languageCode: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  changingIndicator: {
    marginTop: 16,
    alignItems: 'center',
  },
  changingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default LanguageSelector;
