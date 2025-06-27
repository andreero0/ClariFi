import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useLocalization } from '../../context/LocalizationContext';
import { useAnalyticsSafe } from '../../hooks/useAnalyticsSafe';
import { spacing } from '../../constants/spacing';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import Icon from '../ui/Icon';
import ProgressBar from '../ui/ProgressBar';
import LoadingSpinner from '../ui/LoadingSpinner';
import LanguageSelector from './LanguageSelector';
import {
  EducationModule,
  UserEducationProgress,
  EDUCATION_CATEGORIES,
  DIFFICULTY_LEVELS,
  EducationHubProps,
} from '../../types/education';
import { educationService } from '../../services/education';
import { BookOpen, CheckCircle, AlertCircle } from 'lucide-react-native';

interface EducationHubState {
  modules: EducationModule[];
  userProgress: UserEducationProgress | null;
  loading: boolean;
  error: string | null;
}

export const EducationHub: React.FC<EducationHubProps> = ({
  modules: propModules,
  userProgress: propUserProgress,
  language: propLanguage,
  onModuleSelect,
  onLanguageChange,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { currentLanguage, changeLanguage } = useLocalization();
  const { track, events } = useAnalyticsSafe();
  const [state, setState] = useState<EducationHubState>({
    modules: propModules || [],
    userProgress: propUserProgress || null,
    loading: !propModules,
    error: null,
  });

  // Use localization context language or prop language
  const activeLanguage = propLanguage || currentLanguage;

  useEffect(() => {
    if (!propModules) {
      loadEducationData();
    } else {
      setState(prev => ({
        ...prev,
        modules: propModules,
        userProgress: propUserProgress,
        loading: false,
      }));
    }
  }, [propModules, propUserProgress]);

  const loadEducationData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Initialize education service if not already done
      await educationService.initialize('current-user'); // In real app, get from auth context

      const modules = educationService.getModules();
      const userProgress = educationService.getUserProgress();

      setState(prev => ({
        ...prev,
        modules,
        userProgress,
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to load education data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load education content. Please try again.',
        loading: false,
      }));
    }
  };

  const handleLanguageChange = async (newLanguage: 'en' | 'fr') => {
    try {
      await changeLanguage(newLanguage);
      await educationService.setPreferredLanguage(newLanguage);

      // Track language change
      track(events.education.languageChanged, {
        from_language: currentLanguage,
        to_language: newLanguage,
        source: 'education_hub',
      });

      if (onLanguageChange) {
        onLanguageChange(newLanguage);
      }
    } catch (error) {
      console.error('Failed to change language:', error);
      Alert.alert(t('common.error'), t('education.errors.languageChange'));
    }
  };

  const getModuleProgress = (moduleId: string) => {
    if (!state.userProgress) return null;
    return state.userProgress.modules.find(m => m.moduleId === moduleId);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const renderModuleCard = (module: EducationModule) => {
    const progress = getModuleProgress(module.id);
    const isStarted = !!progress;
    const isCompleted = progress?.isCompleted || false;
    const completionPercentage = progress?.completionPercentage || 0;

    return (
      <Card
        key={module.id}
        style={styles.moduleCard}
        onPress={() => {
          // Track module selection
          track(events.education.moduleStarted, {
            module_id: module.id,
            module_title: module.title[activeLanguage],
            category: module.category,
            difficulty: module.difficulty,
            language: activeLanguage,
            is_started: isStarted,
            completion_percentage: completionPercentage,
          });
          onModuleSelect(module.id);
        }}
        accessibilityLabel={`${module.title[activeLanguage]} module`}
        accessibilityHint={`Tap to start or continue this module`}
      >
        <View style={styles.moduleHeader}>
          <View style={styles.moduleIconContainer}>
            <Icon
              name={BookOpen}
              size={24}
              color={isCompleted ? theme.success : theme.primary}
            />
          </View>
          <View style={styles.moduleInfo}>
            <Text style={[styles.moduleTitle, { color: theme.textPrimary }]}>
              {module.title[activeLanguage]}
            </Text>
            <Text
              style={[styles.moduleCategory, { color: theme.textSecondary }]}
            >
              {EDUCATION_CATEGORIES[module.category][activeLanguage]} •{' '}
              {DIFFICULTY_LEVELS[module.difficulty][activeLanguage]}
            </Text>
          </View>
          {isCompleted && (
            <Icon name={CheckCircle} size={20} color={theme.success} />
          )}
        </View>

        <Text
          style={[styles.moduleDescription, { color: theme.textSecondary }]}
        >
          {module.description[activeLanguage]}
        </Text>

        <View style={styles.moduleFooter}>
          <View style={styles.moduleStats}>
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {formatDuration(module.estimatedDuration)}
            </Text>
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {module.lessons.length} lessons
            </Text>
          </View>

          {isStarted && (
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={completionPercentage}
                height={6}
                backgroundColor={theme.backgroundOffset}
                progressColor={isCompleted ? theme.success : theme.primary}
              />
              <Text
                style={[styles.progressText, { color: theme.textSecondary }]}
              >
                {Math.round(completionPercentage)}% complete
              </Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {t('education.hub.title')}
        </Text>
        <LanguageSelector
          compact={true}
          showTitle={false}
          onLanguageChange={handleLanguageChange}
        />
      </View>

      {state.userProgress && (
        <View style={styles.overallProgress}>
          <Text style={[styles.progressTitle, { color: theme.textPrimary }]}>
            {t('education.progress.title')}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>
                {educationService.getLearningStats().completedModules}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                {t('education.progress.modulesCompleted')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>
                {Math.round(
                  educationService.getLearningStats().totalTimeSpent / 60
                )}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                {t('education.hub.minutes', {
                  count: Math.round(
                    educationService.getLearningStats().totalTimeSpent / 60
                  ),
                })}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>
                {Math.round(
                  educationService.getLearningStats().completionPercentage
                )}
                %
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                {t('education.progress.overallProgress')}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  if (state.loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
      >
        <View style={styles.centerContent}>
          <LoadingSpinner size="large" />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            {t('education.progress.loadingProgress')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state.error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
      >
        <View style={styles.centerContent}>
          <Icon name={AlertCircle} size={48} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>
            {state.error}
          </Text>
          <Button
            title="Retry"
            onPress={loadEducationData}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}

        <View style={styles.modulesSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {t('education.hub.title')}
          </Text>
          {state.modules.map(renderModuleCard)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    minWidth: 120,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  languageButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  overallProgress: {
    marginTop: spacing.md,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  modulesSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  moduleCard: {
    marginBottom: spacing.lg,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  moduleIconContainer: {
    marginRight: spacing.md,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  moduleCategory: {
    fontSize: 14,
  },
  moduleDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  moduleFooter: {
    marginTop: spacing.sm,
  },
  moduleStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statText: {
    fontSize: 12,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressText: {
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
});

export default EducationHub;
