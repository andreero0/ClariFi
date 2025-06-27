import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAnalyticsSafe } from '../../hooks/useAnalyticsSafe';
import { spacing } from '../../constants/spacing';
import Card from '../../components/ui/Card';
import Icon from '../../components/ui/Icon';
import CircularProgress from '../../components/charts/CircularProgress';
import ProgressBar from '../../components/ui/ProgressBar';
import { educationService } from '../../services/education';
import {
  Award,
  TrendingUp,
  Clock,
  Calendar,
  BookOpen,
  Target,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';

interface ModuleProgress {
  moduleId: string;
  moduleName: string;
  completionPercentage: number;
  lessonsCompleted: number;
  totalLessons: number;
  quizScore: number | null;
  timeSpent: number;
  lastAccessed: Date;
}

const ProgressReportScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { track, events } = useAnalyticsSafe();
  const [loading, setLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);
  const [stats, setStats] = useState({
    totalModules: 0,
    completedModules: 0,
    averageQuizScore: 0,
    totalTimeSpent: 0,
    currentStreak: 0,
    longestStreak: 0,
  });

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      
      // Get user progress
      const userProgress = educationService.getUserProgress();
      const learningStats = educationService.getLearningStats();
      
      // Calculate overall progress
      const overall = learningStats.completionPercentage || 0;
      setOverallProgress(overall);

      // Get module-specific progress
      const modules = educationService.getModules();
      const moduleProgressData: ModuleProgress[] = modules.map(module => {
        const progress = userProgress?.modules.find(m => m.moduleId === module.id);
        return {
          moduleId: module.id,
          moduleName: module.title['en'], // Use current language
          completionPercentage: progress?.completionPercentage || 0,
          lessonsCompleted: progress?.lessonsCompleted.length || 0,
          totalLessons: module.lessons.length,
          quizScore: progress?.quizResults.length > 0 
            ? progress.quizResults.reduce((sum, r) => sum + r.score, 0) / progress.quizResults.length
            : null,
          timeSpent: progress?.timeSpent || 0,
          lastAccessed: progress?.lastAccessed || new Date(),
        };
      });

      setModuleProgress(moduleProgressData);
      
      // Set stats
      setStats({
        totalModules: modules.length,
        completedModules: learningStats.completedModules,
        averageQuizScore: learningStats.averageQuizScore,
        totalTimeSpent: Math.round(learningStats.totalTimeSpent / 60), // Convert to hours
        currentStreak: learningStats.streakDays || 0,
        longestStreak: learningStats.longestStreak || 0,
      });

      // Track progress report view
      track(events.education.progressReportViewed, {
        overall_progress: overall,
        completed_modules: learningStats.completedModules,
      });
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return theme.success;
    if (percentage >= 60) return theme.warning;
    if (percentage >= 40) return theme.secondary;
    return theme.error;
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {t('education.progressReport.title', 'Learning Progress')}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Overall Progress */}
        <Card style={styles.overallProgressCard}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {t('education.progressReport.overallProgress', 'Overall Progress')}
          </Text>
          
          <View style={styles.progressCircleContainer}>
            <CircularProgress
              progress={overallProgress}
              size={180}
              strokeWidth={12}
              color={getProgressColor(overallProgress)}
              animationDuration={1500}
            >
              <Icon 
                name={Award} 
                size={32} 
                color={getProgressColor(overallProgress)} 
              />
              <Text style={[styles.progressPercentage, { color: theme.textPrimary }]}>
                {Math.round(overallProgress)}%
              </Text>
              <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                Complete
              </Text>
            </CircularProgress>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name={BookOpen} size={20} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {stats.completedModules}/{stats.totalModules}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Modules
              </Text>
            </View>

            <View style={styles.statItem}>
              <Icon name={Target} size={20} color={theme.secondary} />
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {Math.round(stats.averageQuizScore)}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Quiz Average
              </Text>
            </View>

            <View style={styles.statItem}>
              <Icon name={Clock} size={20} color={theme.success} />
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {stats.totalTimeSpent}h
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Time Invested
              </Text>
            </View>
          </View>
        </Card>

        {/* Streak Information */}
        <Card style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Icon name={TrendingUp} size={24} color={theme.warning} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {t('education.progressReport.learningStreak', 'Learning Streak')}
            </Text>
          </View>
          
          <View style={styles.streakContent}>
            <View style={styles.streakItem}>
              <Text style={[styles.streakNumber, { color: theme.warning }]}>
                {stats.currentStreak}
              </Text>
              <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>
                Current Streak
              </Text>
            </View>
            
            <View style={styles.streakDivider} />
            
            <View style={styles.streakItem}>
              <Text style={[styles.streakNumber, { color: theme.textPrimary }]}>
                {stats.longestStreak}
              </Text>
              <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>
                Longest Streak
              </Text>
            </View>
          </View>

          <View style={styles.streakCalendar}>
            {/* Simplified streak calendar */}
            <View style={styles.weekDays}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <Text key={index} style={[styles.weekDay, { color: theme.textSecondary }]}>
                  {day}
                </Text>
              ))}
            </View>
          </View>
        </Card>

        {/* Module Progress */}
        <Card style={styles.moduleProgressCard}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {t('education.progressReport.moduleProgress', 'Module Progress')}
          </Text>

          {moduleProgress.map((module) => (
            <View key={module.moduleId} style={styles.moduleItem}>
              <View style={styles.moduleHeader}>
                <Text style={[styles.moduleName, { color: theme.textPrimary }]}>
                  {module.moduleName}
                </Text>
                <Text style={[styles.modulePercentage, { color: theme.textSecondary }]}>
                  {Math.round(module.completionPercentage)}%
                </Text>
              </View>

              <ProgressBar
                progress={module.completionPercentage}
                height={8}
                backgroundColor={theme.backgroundOffset}
                progressColor={getProgressColor(module.completionPercentage)}
              />

              <View style={styles.moduleStats}>
                <View style={styles.moduleStat}>
                  <Icon 
                    name={CheckCircle} 
                    size={16} 
                    color={theme.success} 
                  />
                  <Text style={[styles.moduleStatText, { color: theme.textSecondary }]}>
                    {module.lessonsCompleted}/{module.totalLessons} lessons
                  </Text>
                </View>

                {module.quizScore !== null && (
                  <View style={styles.moduleStat}>
                    <Icon 
                      name={Award} 
                      size={16} 
                      color={theme.secondary} 
                    />
                    <Text style={[styles.moduleStatText, { color: theme.textSecondary }]}>
                      {Math.round(module.quizScore)}% quiz
                    </Text>
                  </View>
                )}

                <View style={styles.moduleStat}>
                  <Icon 
                    name={Clock} 
                    size={16} 
                    color={theme.primary} 
                  />
                  <Text style={[styles.moduleStatText, { color: theme.textSecondary }]}>
                    {formatTime(module.timeSpent)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card>

        {/* Export Options */}
        <Card style={styles.exportCard}>
          <TouchableOpacity style={styles.exportButton}>
            <Icon name="download" size={20} color={theme.primary} />
            <Text style={[styles.exportText, { color: theme.primary }]}>
              {t('education.progressReport.exportReport', 'Export Progress Report')}
            </Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollContent: {
    padding: spacing.lg,
  },
  overallProgressCard: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  progressCircleContainer: {
    marginVertical: spacing.xl,
  },
  progressPercentage: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
  progressLabel: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  streakCard: {
    marginBottom: spacing.lg,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  streakContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  streakItem: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  streakDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  streakCalendar: {
    marginTop: spacing.md,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weekDay: {
    fontSize: 12,
    fontWeight: '600',
  },
  moduleProgressCard: {
    marginBottom: spacing.lg,
  },
  moduleItem: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: '500',
  },
  modulePercentage: {
    fontSize: 14,
  },
  moduleStats: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  moduleStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  moduleStatText: {
    fontSize: 12,
  },
  exportCard: {
    marginBottom: spacing.xl,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  exportText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
});

export default ProgressReportScreen;