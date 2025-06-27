import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../context/ThemeContext';
import { useAnalyticsSafe } from '../../hooks/useAnalyticsSafe';
import { spacing } from '../../constants/spacing';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import Icon from '../ui/Icon';
import ProgressBar from '../ui/ProgressBar';
import LoadingSpinner from '../ui/LoadingSpinner';
import {
  EducationModule,
  Lesson,
  ModuleProgress,
  ModuleViewerProps,
} from '../../types/education';
import { educationService } from '../../services/education';

interface ModuleViewerState {
  module: EducationModule | null;
  currentLesson: Lesson | null;
  currentLessonIndex: number;
  moduleProgress: ModuleProgress | null;
  lessonContent: string;
  loading: boolean;
  error: string | null;
  startTime: Date;
}

export const ModuleViewer: React.FC<ModuleViewerProps> = ({
  module: propModule,
  currentLessonId,
  userProgress,
  language,
  onLessonComplete,
  onNavigateToLesson,
  onBackToHub,
}) => {
  const { theme } = useTheme();
  const { track, events } = useAnalyticsSafe();
  const [state, setState] = useState<ModuleViewerState>({
    module: propModule || null,
    currentLesson: null,
    currentLessonIndex: 0,
    moduleProgress: userProgress || null,
    lessonContent: '',
    loading: true,
    error: null,
    startTime: new Date(),
  });

  useEffect(() => {
    if (propModule) {
      initializeModule(propModule);
    }
  }, [propModule, currentLessonId, language]);

  const initializeModule = async (module: EducationModule) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      let lessonIndex = 0;
      if (currentLessonId) {
        const index = module.lessons.findIndex(
          lesson => lesson.id === currentLessonId
        );
        if (index !== -1) lessonIndex = index;
      }

      const lesson = module.lessons[lessonIndex];
      await loadLessonContent(lesson);

      setState(prev => ({
        ...prev,
        module,
        currentLesson: lesson,
        currentLessonIndex: lessonIndex,
        loading: false,
        startTime: new Date(),
      }));
    } catch (error) {
      console.error('Failed to initialize module:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load module content. Please try again.',
        loading: false,
      }));
    }
  };

  const loadLessonContent = async (lesson: Lesson) => {
    try {
      const contentPath = lesson.contentFile[language];
      const content = await educationService.loadLessonContent(contentPath);
      setState(prev => ({ ...prev, lessonContent: content }));
    } catch (error) {
      console.error('Failed to load lesson content:', error);
      // For now, use placeholder content
      setState(prev => ({
        ...prev,
        lessonContent: `# ${lesson.title[language]}\n\nContent loading...\n\nThis lesson content would be loaded from:\n\`${lesson.contentFile[language]}\``,
      }));
    }
  };

  const navigateToLesson = async (lessonIndex: number) => {
    if (
      !state.module ||
      lessonIndex < 0 ||
      lessonIndex >= state.module.lessons.length
    ) {
      return;
    }

    // Track time spent on current lesson
    if (state.currentLesson) {
      const timeSpent = Math.floor(
        (new Date().getTime() - state.startTime.getTime()) / 1000
      );
      // Don't mark as complete, just track time
      console.log(
        `Time spent on lesson ${state.currentLesson.id}: ${timeSpent} seconds`
      );
    }

    const lesson = state.module.lessons[lessonIndex];
    setState(prev => ({ ...prev, loading: true }));

    try {
      await loadLessonContent(lesson);
      setState(prev => ({
        ...prev,
        currentLesson: lesson,
        currentLessonIndex: lessonIndex,
        loading: false,
        startTime: new Date(),
      }));

      onNavigateToLesson(lesson.id);
    } catch (error) {
      console.error('Failed to navigate to lesson:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load lesson content.',
        loading: false,
      }));
    }
  };

  const markLessonComplete = async () => {
    if (!state.module || !state.currentLesson) return;

    const timeSpent = Math.floor(
      (new Date().getTime() - state.startTime.getTime()) / 1000
    );

    try {
      await educationService.completeLesson(
        state.module.id,
        state.currentLesson.id,
        timeSpent
      );

      // Track lesson completion
      track(events.education.lessonCompleted, {
        module_id: state.module.id,
        lesson_id: state.currentLesson.id,
        lesson_title: state.currentLesson.title[language],
        time_spent_seconds: timeSpent,
        lesson_index: state.currentLessonIndex,
        total_lessons: state.module.lessons.length,
        language,
      });

      onLessonComplete(state.currentLesson.id, timeSpent);

      // Navigate to next lesson if available
      if (state.currentLessonIndex < state.module.lessons.length - 1) {
        await navigateToLesson(state.currentLessonIndex + 1);
      } else {
        // Module completed
        Alert.alert(
          'Module Complete!',
          'Congratulations! You have completed this module.',
          [
            { text: 'Back to Hub', onPress: onBackToHub },
            { text: 'Review Lessons', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to mark lesson complete:', error);
      Alert.alert('Error', 'Failed to save progress. Please try again.');
    }
  };

  const getLessonProgress = (lessonId: string) => {
    if (!state.moduleProgress) return null;
    return state.moduleProgress.lessonsProgress.find(
      p => p.lessonId === lessonId
    );
  };

  const renderHeader = () => {
    if (!state.module) return null;

    const completedLessons =
      state.moduleProgress?.lessonsProgress.filter(p => p.completed).length ||
      0;
    const totalLessons = state.module.lessons.length;
    const progress =
      totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return (
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={onBackToHub}
            style={styles.backButton}
            accessibilityLabel="Back to hub"
            accessibilityRole="button"
            accessibilityHint="Return to the education hub"
          >
            <Icon name="arrow-left" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.moduleTitle, { color: theme.textPrimary }]}>
              {state.module.title[language]}
            </Text>
            <Text
              style={[styles.lessonCounter, { color: theme.textSecondary }]}
            >
              Lesson {state.currentLessonIndex + 1} of {totalLessons}
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <ProgressBar
            progress={progress}
            height={6}
            backgroundColor={theme.backgroundOffset}
            progressColor={theme.primary}
          />
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
            {Math.round(progress)}% complete ({completedLessons}/{totalLessons}{' '}
            lessons)
          </Text>
        </View>
      </View>
    );
  };

  const renderLessonNavigation = () => {
    if (!state.module || !state.currentLesson) return null;

    const isFirstLesson = state.currentLessonIndex === 0;
    const isLastLesson =
      state.currentLessonIndex === state.module.lessons.length - 1;
    const lessonProgress = getLessonProgress(state.currentLesson.id);
    const isCompleted = lessonProgress?.completed || false;

    return (
      <Card style={styles.navigationCard}>
        <View style={styles.navigationHeader}>
          <Text style={[styles.lessonTitle, { color: theme.textPrimary }]}>
            {state.currentLesson.title[language]}
          </Text>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Icon name="check-circle" size={16} color={theme.success} />
              <Text style={[styles.completedText, { color: theme.success }]}>
                Completed
              </Text>
            </View>
          )}
        </View>

        <View style={styles.navigationButtons}>
          <Button
            title="Previous"
            onPress={() => navigateToLesson(state.currentLessonIndex - 1)}
            disabled={isFirstLesson}
            variant="outline"
            style={[styles.navButton, isFirstLesson && styles.disabledButton]}
          />

          <Button
            title={
              isCompleted ? (isLastLesson ? 'Review' : 'Next') : 'Complete'
            }
            onPress={
              isCompleted && !isLastLesson
                ? () => navigateToLesson(state.currentLessonIndex + 1)
                : markLessonComplete
            }
            style={styles.navButton}
            variant={isCompleted ? 'outline' : 'primary'}
          />
        </View>
      </Card>
    );
  };

  const renderMarkdownStyles = () => ({
    body: {
      color: theme.textPrimary,
      fontSize: 16,
      lineHeight: 24,
    },
    heading1: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: spacing.md,
      marginTop: spacing.lg,
    },
    heading2: {
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: '600',
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
    heading3: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
    paragraph: {
      color: theme.textPrimary,
      fontSize: 16,
      lineHeight: 24,
      marginBottom: spacing.md,
    },
    list_item: {
      color: theme.textPrimary,
      fontSize: 16,
      lineHeight: 24,
    },
    strong: {
      color: theme.textPrimary,
      fontWeight: 'bold',
    },
    em: {
      color: theme.textPrimary,
      fontStyle: 'italic',
    },
    code_inline: {
      backgroundColor: theme.backgroundOffset,
      color: theme.primary,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xxs,
      borderRadius: 4,
      fontSize: 14,
    },
    code_block: {
      backgroundColor: theme.backgroundOffset,
      padding: spacing.md,
      borderRadius: 8,
      marginVertical: spacing.sm,
    },
    blockquote: {
      backgroundColor: theme.backgroundOffset,
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
      paddingLeft: spacing.md,
      paddingVertical: spacing.sm,
      marginVertical: spacing.sm,
    },
    hr: {
      backgroundColor: theme.borderLight,
      height: 1,
      marginVertical: spacing.lg,
    },
  });

  if (state.loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
      >
        <View style={styles.centerContent}>
          <LoadingSpinner size="large" />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading lesson content...
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
          <Icon name="alert-circle" size={48} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>
            {state.error}
          </Text>
          <Button
            title="Back to Hub"
            onPress={onBackToHub}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
    >
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderLessonNavigation()}

        <Card style={styles.contentCard}>
          <Markdown style={renderMarkdownStyles()}>
            {state.lessonContent}
          </Markdown>
        </Card>
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
  errorButton: {
    minWidth: 120,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  lessonCounter: {
    fontSize: 14,
  },
  progressSection: {
    marginTop: spacing.sm,
  },
  progressText: {
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  navigationCard: {
    marginBottom: spacing.lg,
  },
  navigationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  completedText: {
    fontSize: 12,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  contentCard: {
    marginBottom: spacing.xl,
  },
});

export default ModuleViewer;
