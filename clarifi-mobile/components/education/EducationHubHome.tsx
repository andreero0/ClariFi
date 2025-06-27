import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  Award,
  TrendingUp,
  Clock,
  Star,
  Globe,
  ChevronRight,
  Play,
  CheckCircle,
  Trophy,
  Target,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

const { width } = Dimensions.get('window');

interface LearningModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  progress: number;
  coverGradient: string[];
  icon: React.ReactNode;
  isCompleted: boolean;
  isSuggested: boolean;
}

interface Achievement {
  id: string;
  title: string;
  icon: React.ReactNode;
  unlocked: boolean;
  date?: string;
}

const EducationHubHome: React.FC = () => {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'fr'>('en');
  const [userProgress, setUserProgress] = useState({
    completedModules: 3,
    totalModules: 8,
    studyStreak: 7,
    totalPoints: 450,
  });

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: userProgress.completedModules / userProgress.totalModules,
        duration: 1500,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const learningModules: LearningModule[] = [
    {
      id: '1',
      title: 'Banking Basics in Canada',
      description: 'Learn about Canadian banking system, account types, and essential services',
      duration: '15 min',
      difficulty: 'Beginner',
      progress: 100,
      coverGradient: [colors.clarityBlue, colors.primaryHover],
      icon: <BookOpen size={24} color={colors.pureWhite} />,
      isCompleted: true,
      isSuggested: false,
    },
    {
      id: '2',
      title: 'Credit Building 101',
      description: 'Understanding credit scores, building credit history, and responsible usage',
      duration: '20 min',
      difficulty: 'Beginner',
      progress: 100,
      coverGradient: [colors.growthGreen, colors.success],
      icon: <TrendingUp size={24} color={colors.pureWhite} />,
      isCompleted: true,
      isSuggested: false,
    },
    {
      id: '3',
      title: 'Canadian Tax Basics',
      description: 'Essential tax information for newcomers including SIN, filing, and benefits',
      duration: '25 min',
      difficulty: 'Intermediate',
      progress: 100,
      coverGradient: [colors.wisdomPurple, '#8B5CF6'],
      icon: <Target size={24} color={colors.pureWhite} />,
      isCompleted: true,
      isSuggested: false,
    },
    {
      id: '4',
      title: 'Budgeting & Saving',
      description: 'Create effective budgets and build emergency funds in your new country',
      duration: '18 min',
      difficulty: 'Beginner',
      progress: 60,
      coverGradient: [colors.warning, '#F59E0B'],
      icon: <Star size={24} color={colors.pureWhite} />,
      isCompleted: false,
      isSuggested: true,
    },
    {
      id: '5',
      title: 'Investment Fundamentals',
      description: 'RRSP, TFSA, and basic investment strategies for Canadian residents',
      duration: '30 min',
      difficulty: 'Intermediate',
      progress: 0,
      coverGradient: [colors.clarityBlue, colors.wisdomPurple],
      icon: <Trophy size={24} color={colors.pureWhite} />,
      isCompleted: false,
      isSuggested: false,
    },
    {
      id: '6',
      title: 'Insurance Essentials',
      description: 'Health, life, and property insurance basics for newcomers',
      duration: '22 min',
      difficulty: 'Intermediate',
      progress: 0,
      coverGradient: [colors.success, colors.growthGreen],
      icon: <CheckCircle size={24} color={colors.pureWhite} />,
      isCompleted: false,
      isSuggested: false,
    },
  ];

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Steps',
      icon: <Star size={20} color={colors.growthGreen} />,
      unlocked: true,
      date: '2024-01-15',
    },
    {
      id: '2',
      title: 'Credit Master',
      icon: <TrendingUp size={20} color={colors.clarityBlue} />,
      unlocked: true,
      date: '2024-01-20',
    },
    {
      id: '3',
      title: 'Week Warrior',
      icon: <Award size={20} color={colors.wisdomPurple} />,
      unlocked: true,
      date: '2024-01-22',
    },
    {
      id: '4',
      title: 'Tax Expert',
      icon: <Target size={20} color={colors.neutralGray} />,
      unlocked: false,
    },
  ];

  const completionPercentage = Math.round((userProgress.completedModules / userProgress.totalModules) * 100);

  const handleModulePress = (moduleId: string) => {
    router.push('/education/module-viewer');
  };

  const handleInteractiveLearningPress = () => {
    router.push('/education/interactive-learning');
  };

  const handleAchievementsPress = () => {
    router.push('/education/achievement-gallery');
  };

  const renderLanguageToggle = () => (
    <Animated.View style={[styles.languageToggle, { opacity: fadeAnim }]}>
      <Globe size={20} color={colors.neutralGray} />
      <Text style={[styles.languageLabel, currentLanguage === 'en' && styles.activeLanguage]}>EN</Text>
      <Switch
        value={currentLanguage === 'fr'}
        onValueChange={(value) => setCurrentLanguage(value ? 'fr' : 'en')}
        trackColor={{ false: colors.cloudGray, true: colors.clarityBlue }}
        thumbColor={colors.pureWhite}
        style={styles.languageSwitch}
      />
      <Text style={[styles.languageLabel, currentLanguage === 'fr' && styles.activeLanguage]}>FR</Text>
    </Animated.View>
  );

  const renderWelcomeBanner = () => (
    <Animated.View style={[styles.welcomeBanner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <LinearGradient
        colors={[colors.wisdomPurple, colors.clarityBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.welcomeGradient}
      >
        <View style={styles.welcomeContent}>
          <View style={styles.sparkleIcon}>
            <Sparkles size={24} color={colors.pureWhite} />
          </View>
          <Text style={styles.welcomeTitle}>
            {currentLanguage === 'en' ? 'Welcome to Canada!' : 'Bienvenue au Canada!'}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {currentLanguage === 'en' 
              ? 'Master Canadian finances with confidence' 
              : 'Maîtrisez les finances canadiennes en toute confiance'}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderProgressOverview = () => (
    <Animated.View style={[styles.progressSection, { opacity: fadeAnim }]}>
      <Text style={styles.sectionTitle}>
        {currentLanguage === 'en' ? 'Your Learning Journey' : 'Votre parcours d\'apprentissage'}
      </Text>
      
      <View style={styles.progressContainer}>
        {/* Circular Progress */}
        <View style={styles.circularProgress}>
          <View style={styles.progressCircle}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  transform: [{
                    rotate: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', `${completionPercentage * 3.6}deg`],
                    })
                  }]
                }
              ]}
            />
            <View style={styles.progressCenter}>
              <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
              <Text style={styles.progressLabel}>
                {currentLanguage === 'en' ? 'Complete' : 'Terminé'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <BookOpen size={20} color={colors.clarityBlue} />
            <Text style={styles.statValue}>{userProgress.completedModules}/{userProgress.totalModules}</Text>
            <Text style={styles.statLabel}>
              {currentLanguage === 'en' ? 'Modules' : 'Modules'}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Clock size={20} color={colors.growthGreen} />
            <Text style={styles.statValue}>{userProgress.studyStreak}</Text>
            <Text style={styles.statLabel}>
              {currentLanguage === 'en' ? 'Day Streak' : 'Jours d\'affilée'}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Star size={20} color={colors.warning} />
            <Text style={styles.statValue}>{userProgress.totalPoints}</Text>
            <Text style={styles.statLabel}>
              {currentLanguage === 'en' ? 'Points' : 'Points'}
            </Text>
          </View>
        </View>
        
        {/* Quick Action Button for Interactive Learning */}
        <TouchableOpacity style={styles.interactiveLearningButton} onPress={handleInteractiveLearningPress}>
          <Text style={styles.interactiveLearningText}>
            {currentLanguage === 'en' ? 'Try Interactive Learning' : 'Essayer l\'apprentissage interactif'}
          </Text>
          <ChevronRight size={16} color={colors.clarityBlue} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderModuleCard = (module: LearningModule, index: number) => {
    const getDifficultyColor = (difficulty: string) => {
      switch (difficulty) {
        case 'Beginner': return colors.growthGreen;
        case 'Intermediate': return colors.warning;
        case 'Advanced': return colors.errorRed;
        default: return colors.neutralGray;
      }
    };

    return (
      <Animated.View
        key={module.id}
        style={[
          styles.moduleCard,
          module.isSuggested && styles.suggestedCard,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0, (index + 1) * 10],
              })
            }]
          }
        ]}
      >
        <TouchableOpacity activeOpacity={0.8} onPress={() => handleModulePress(module.id)}>
          <LinearGradient
            colors={module.coverGradient}
            style={styles.moduleCardGradient}
          >
            {module.isSuggested && (
              <View style={styles.suggestedBadge}>
                <Sparkles size={12} color={colors.pureWhite} />
                <Text style={styles.suggestedText}>
                  {currentLanguage === 'en' ? 'SUGGESTED' : 'SUGGÉRÉ'}
                </Text>
              </View>
            )}
            
            <View style={styles.moduleIcon}>
              {module.icon}
            </View>
            
            <View style={styles.moduleOverlay}>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              <Text style={styles.moduleDescription}>{module.description}</Text>
              
              <View style={styles.moduleMetadata}>
                <View style={styles.metadataItem}>
                  <Clock size={14} color={colors.pureWhite} />
                  <Text style={styles.metadataText}>{module.duration}</Text>
                </View>
                
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(module.difficulty) + '40' }]}>
                  <Text style={[styles.difficultyText, { color: getDifficultyColor(module.difficulty) }]}>
                    {currentLanguage === 'en' ? module.difficulty : 
                     module.difficulty === 'Beginner' ? 'Débutant' :
                     module.difficulty === 'Intermediate' ? 'Intermédiaire' : 'Avancé'}
                  </Text>
                </View>
              </View>
              
              {/* Progress Bar */}
              {module.progress > 0 && (
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <View 
                      style={[
                        styles.progressBarFill,
                        { width: `${module.progress}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>{module.progress}%</Text>
                </View>
              )}
              
              {module.isCompleted && (
                <View style={styles.completedIndicator}>
                  <CheckCircle size={16} color={colors.growthGreen} />
                  <Text style={styles.completedText}>
                    {currentLanguage === 'en' ? 'Completed' : 'Terminé'}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderAchievementsPreview = () => (
    <Animated.View style={[styles.achievementsSection, { opacity: fadeAnim }]}>
      <View style={styles.achievementsHeader}>
        <Text style={styles.sectionTitle}>
          {currentLanguage === 'en' ? 'Recent Achievements' : 'Réalisations récentes'}
        </Text>
        <TouchableOpacity style={styles.viewAllButton} onPress={handleAchievementsPress}>
          <Text style={styles.viewAllText}>
            {currentLanguage === 'en' ? 'View All' : 'Voir tout'}
          </Text>
          <ChevronRight size={16} color={colors.clarityBlue} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.achievementsList}>
        {achievements.slice(0, 4).map((achievement) => (
          <View 
            key={achievement.id} 
            style={[
              styles.achievementBadge,
              !achievement.unlocked && styles.lockedBadge
            ]}
          >
            <View style={[
              styles.achievementIcon,
              { 
                backgroundColor: achievement.unlocked ? colors.pureWhite : colors.neutralGray + '40',
                opacity: achievement.unlocked ? 1 : 0.5 
              }
            ]}>
              {achievement.icon}
            </View>
            <Text style={[
              styles.achievementTitle,
              !achievement.unlocked && styles.lockedAchievementTitle
            ]}>
              {achievement.title}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Language Toggle */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {currentLanguage === 'en' ? 'Financial Education' : 'Éducation financière'}
          </Text>
          {renderLanguageToggle()}
        </View>

        {/* Welcome Banner */}
        {renderWelcomeBanner()}

        {/* Progress Overview */}
        {renderProgressOverview()}

        {/* Learning Modules */}
        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>
            {currentLanguage === 'en' ? 'Learning Modules' : 'Modules d\'apprentissage'}
          </Text>
          
          {learningModules.map((module, index) => renderModuleCard(module, index))}
        </View>

        {/* Achievements Preview */}
        {renderAchievementsPreview()}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...textStyles.h1,
    color: colors.midnightInk,
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pureWhite,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  languageLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
    marginHorizontal: spacing.xs,
  },
  activeLanguage: {
    color: colors.clarityBlue,
    fontWeight: '600',
  },
  languageSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  welcomeBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: 20,
    overflow: 'hidden',
  },
  welcomeGradient: {
    padding: spacing.xl,
  },
  welcomeContent: {
    alignItems: 'center',
  },
  sparkleIcon: {
    marginBottom: spacing.md,
  },
  welcomeTitle: {
    ...textStyles.h2,
    color: colors.pureWhite,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    ...textStyles.body,
    color: colors.pureWhite,
    textAlign: 'center',
    opacity: 0.9,
  },
  progressSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...textStyles.h2,
    color: colors.midnightInk,
    marginBottom: spacing.lg,
  },
  progressContainer: {
    backgroundColor: colors.pureWhite,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  circularProgress: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressCircle: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: colors.clarityBlue,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '-90deg' }],
  },
  progressCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cloudGray,
    borderRadius: 52,
    margin: 8,
  },
  progressPercentage: {
    ...textStyles.h2,
    color: colors.clarityBlue,
    fontWeight: '700',
  },
  progressLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  interactiveLearningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.clarityBlue + '10',
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  interactiveLearningText: {
    ...textStyles.button,
    color: colors.clarityBlue,
    fontSize: 14,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginVertical: spacing.xs,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
    textAlign: 'center',
  },
  modulesSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  moduleCard: {
    marginBottom: spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  suggestedCard: {
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  moduleCardGradient: {
    padding: spacing.lg,
    minHeight: 160,
    position: 'relative',
  },
  suggestedBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pureWhite + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  suggestedText: {
    fontSize: 10,
    color: colors.pureWhite,
    fontWeight: '700',
  },
  moduleIcon: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
  moduleOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  moduleTitle: {
    ...textStyles.h3,
    color: colors.pureWhite,
    marginBottom: spacing.xs,
  },
  moduleDescription: {
    ...textStyles.body,
    color: colors.pureWhite,
    opacity: 0.9,
    marginBottom: spacing.md,
  },
  moduleMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metadataText: {
    ...textStyles.caption,
    color: colors.pureWhite,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: colors.pureWhite + '40',
    borderRadius: 2,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: colors.pureWhite,
    borderRadius: 2,
  },
  progressText: {
    ...textStyles.caption,
    color: colors.pureWhite,
    fontWeight: '600',
  },
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  completedText: {
    ...textStyles.caption,
    color: colors.growthGreen,
    fontWeight: '600',
  },
  achievementsSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  viewAllText: {
    ...textStyles.body,
    color: colors.clarityBlue,
  },
  achievementsList: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  achievementBadge: {
    alignItems: 'center',
    backgroundColor: colors.pureWhite,
    borderRadius: 12,
    padding: spacing.md,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lockedBadge: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  achievementTitle: {
    ...textStyles.caption,
    color: colors.midnightInk,
    textAlign: 'center',
    fontWeight: '600',
  },
  lockedAchievementTitle: {
    color: colors.neutralGray,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

export default EducationHubHome;