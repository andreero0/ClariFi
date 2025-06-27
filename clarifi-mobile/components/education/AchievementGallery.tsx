import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Award,
  Trophy,
  Star,
  Target,
  BookOpen,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Share2,
  Lock,
  CheckCircle,
  Calendar,
  Crown,
  Zap,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

const { width } = Dimensions.get('window');

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  category: 'learning' | 'progress' | 'social' | 'financial';
  points: number;
  unlocked: boolean;
  unlockedDate?: string;
  progress?: number;
  requirement: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface LeaderboardEntry {
  id: string;
  username: string;
  points: number;
  badgeCount: number;
  rank: number;
  avatar: string;
}

const AchievementGallery: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'achievements' | 'leaderboard'>('achievements');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userStats] = useState({
    totalPoints: 1250,
    unlockedBadges: 12,
    totalBadges: 24,
    currentRank: 3,
    streakDays: 15,
  });

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
    ]).start();
  }, []);

  const achievements: Achievement[] = [
    // Learning Category
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first learning module',
      icon: <BookOpen size={24} color={colors.pureWhite} />,
      tier: 'bronze',
      category: 'learning',
      points: 50,
      unlocked: true,
      unlockedDate: '2024-01-15',
      requirement: 'Complete 1 module',
      rarity: 'common',
    },
    {
      id: '2',
      title: 'Knowledge Seeker',
      description: 'Complete 5 learning modules',
      icon: <BookOpen size={24} color={colors.pureWhite} />,
      tier: 'silver',
      category: 'learning',
      points: 150,
      unlocked: true,
      unlockedDate: '2024-01-20',
      requirement: 'Complete 5 modules',
      rarity: 'common',
    },
    {
      id: '3',
      title: 'Master Learner',
      description: 'Complete all available modules',
      icon: <Crown size={24} color={colors.pureWhite} />,
      tier: 'gold',
      category: 'learning',
      points: 500,
      unlocked: false,
      progress: 75,
      requirement: 'Complete all 8 modules',
      rarity: 'rare',
    },
    // Progress Category
    {
      id: '4',
      title: 'Streak Starter',
      description: 'Study for 7 consecutive days',
      icon: <Zap size={24} color={colors.pureWhite} />,
      tier: 'bronze',
      category: 'progress',
      points: 75,
      unlocked: true,
      unlockedDate: '2024-01-22',
      requirement: '7-day streak',
      rarity: 'common',
    },
    {
      id: '5',
      title: 'Consistency Champion',
      description: 'Maintain a 30-day learning streak',
      icon: <Target size={24} color={colors.pureWhite} />,
      tier: 'gold',
      category: 'progress',
      points: 300,
      unlocked: false,
      progress: 50,
      requirement: '30-day streak',
      rarity: 'epic',
    },
    // Financial Category
    {
      id: '6',
      title: 'Budget Builder',
      description: 'Create your first budget using the calculator',
      icon: <DollarSign size={24} color={colors.pureWhite} />,
      tier: 'bronze',
      category: 'financial',
      points: 100,
      unlocked: true,
      unlockedDate: '2024-01-18',
      requirement: 'Use budget calculator',
      rarity: 'common',
    },
    {
      id: '7',
      title: 'Credit Score Master',
      description: 'Achieve simulated credit score above 750',
      icon: <TrendingUp size={24} color={colors.pureWhite} />,
      tier: 'platinum',
      category: 'financial',
      points: 750,
      unlocked: false,
      progress: 80,
      requirement: 'Credit score > 750',
      rarity: 'legendary',
    },
    // Social Category
    {
      id: '8',
      title: 'Knowledge Sharer',
      description: 'Share an achievement with friends',
      icon: <Share2 size={24} color={colors.pureWhite} />,
      tier: 'silver',
      category: 'social',
      points: 125,
      unlocked: false,
      progress: 0,
      requirement: 'Share 1 achievement',
      rarity: 'rare',
    },
  ];

  const leaderboard: LeaderboardEntry[] = [
    { id: '1', username: 'FinanceGuru', points: 2250, badgeCount: 18, rank: 1, avatar: '👑' },
    { id: '2', username: 'BudgetMaster', points: 1800, badgeCount: 15, rank: 2, avatar: '🎯' },
    { id: '3', username: 'You', points: userStats.totalPoints, badgeCount: userStats.unlockedBadges, rank: 3, avatar: '⭐' },
    { id: '4', username: 'CreditExpert', points: 1100, badgeCount: 11, rank: 4, avatar: '💎' },
    { id: '5', username: 'SaverPro', points: 950, badgeCount: 9, rank: 5, avatar: '🏆' },
  ];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return '#CD7F32';
      case 'silver': return '#C0C0C0';
      case 'gold': return '#FFD700';
      case 'platinum': return '#E5E4E2';
      default: return colors.neutralGray;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return colors.neutralGray;
      case 'rare': return colors.clarityBlue;
      case 'epic': return colors.wisdomPurple;
      case 'legendary': return colors.warning;
      default: return colors.neutralGray;
    }
  };

  const shareAchievement = async (achievement: Achievement) => {
    try {
      await Share.share({
        message: `I just earned the "${achievement.title}" achievement in ClariFi! 🎉 ${achievement.description}`,
      });
    } catch (error) {
      console.error('Error sharing achievement:', error);
    }
  };

  const renderTabSelector = () => (
    <Animated.View style={[styles.tabSelector, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={[
          styles.tab,
          selectedTab === 'achievements' && styles.activeTab,
        ]}
        onPress={() => setSelectedTab('achievements')}
      >
        <Award size={20} color={selectedTab === 'achievements' ? colors.pureWhite : colors.neutralGray} />
        <Text style={[
          styles.tabText,
          selectedTab === 'achievements' && styles.activeTabText,
        ]}>
          Achievements
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tab,
          selectedTab === 'leaderboard' && styles.activeTab,
        ]}
        onPress={() => setSelectedTab('leaderboard')}
      >
        <Users size={20} color={selectedTab === 'leaderboard' ? colors.pureWhite : colors.neutralGray} />
        <Text style={[
          styles.tabText,
          selectedTab === 'leaderboard' && styles.activeTabText,
        ]}>
          Leaderboard
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderUserStats = () => (
    <Animated.View style={[styles.statsContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <LinearGradient
        colors={[colors.clarityBlue, colors.wisdomPurple]}
        style={styles.statsGradient}
      >
        <View style={styles.statsContent}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.totalPoints}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.unlockedBadges}/{userStats.totalBadges}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>#{userStats.currentRank}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.streakDays}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderCategoryFilter = () => (
    <Animated.View style={[styles.categoryFilter, { opacity: fadeAnim }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollView}>
        {['all', 'learning', 'progress', 'financial', 'social'].map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.activeCategoryButton,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category && styles.activeCategoryButtonText,
            ]}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderAchievementCard = (achievement: Achievement, index: number) => (
    <Animated.View
      key={achievement.id}
      style={[
        styles.achievementCard,
        !achievement.unlocked && styles.lockedCard,
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
      <View style={styles.cardHeader}>
        <LinearGradient
          colors={achievement.unlocked 
            ? [getTierColor(achievement.tier), getTierColor(achievement.tier) + '80']
            : [colors.neutralGray, colors.neutralGray + '80']
          }
          style={styles.achievementIcon}
        >
          {achievement.unlocked ? achievement.icon : <Lock size={24} color={colors.pureWhite} />}
        </LinearGradient>
        
        <View style={styles.cardContent}>
          <View style={styles.cardTitleRow}>
            <Text style={[
              styles.achievementTitle,
              !achievement.unlocked && styles.lockedTitle,
            ]}>
              {achievement.title}
            </Text>
            
            <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(achievement.rarity) + '20' }]}>
              <Text style={[styles.rarityText, { color: getRarityColor(achievement.rarity) }]}>
                {achievement.rarity.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text style={[
            styles.achievementDescription,
            !achievement.unlocked && styles.lockedDescription,
          ]}>
            {achievement.description}
          </Text>
          
          <View style={styles.cardFooter}>
            <View style={styles.pointsContainer}>
              <Star size={16} color={colors.warning} />
              <Text style={styles.pointsText}>{achievement.points} pts</Text>
            </View>
            
            {achievement.unlocked && achievement.unlockedDate && (
              <View style={styles.dateContainer}>
                <Calendar size={14} color={colors.neutralGray} />
                <Text style={styles.dateText}>{achievement.unlockedDate}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      {!achievement.unlocked && achievement.progress !== undefined && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressPercentage}>{achievement.progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${achievement.progress}%` }]} />
          </View>
          <Text style={styles.requirementText}>{achievement.requirement}</Text>
        </View>
      )}
      
      {achievement.unlocked && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => shareAchievement(achievement)}
          >
            <Share2 size={16} color={colors.clarityBlue} />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => (
    <Animated.View
      key={entry.id}
      style={[
        styles.leaderboardEntry,
        entry.username === 'You' && styles.currentUserEntry,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 50],
              outputRange: [0, (index + 1) * 5],
            })
          }]
        }
      ]}
    >
      <View style={styles.rankContainer}>
        <Text style={[
          styles.rankText,
          entry.rank <= 3 && styles.topRankText,
        ]}>
          #{entry.rank}
        </Text>
      </View>
      
      <View style={styles.avatarContainer}>
        <Text style={styles.avatar}>{entry.avatar}</Text>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={[
          styles.username,
          entry.username === 'You' && styles.currentUsername,
        ]}>
          {entry.username}
        </Text>
        <Text style={styles.badgeCount}>{entry.badgeCount} badges</Text>
      </View>
      
      <View style={styles.pointsInfo}>
        <Text style={styles.leaderboardPoints}>{entry.points.toLocaleString()}</Text>
        <Text style={styles.pointsLabel}>points</Text>
      </View>
      
      {entry.rank <= 3 && (
        <View style={styles.crownContainer}>
          {entry.rank === 1 && <Crown size={20} color={colors.warning} />}
          {entry.rank === 2 && <Trophy size={20} color="#C0C0C0" />}
          {entry.rank === 3 && <Award size={20} color="#CD7F32" />}
        </View>
      )}
    </Animated.View>
  );

  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.headerTitle}>Achievement Gallery</Text>
          <Text style={styles.headerSubtitle}>
            Track your learning journey and compete with others
          </Text>
        </Animated.View>

        {/* User Stats */}
        {renderUserStats()}

        {/* Tab Selector */}
        {renderTabSelector()}

        {selectedTab === 'achievements' ? (
          <>
            {/* Category Filter */}
            {renderCategoryFilter()}

            {/* Achievements Grid */}
            <View style={styles.achievementsGrid}>
              {filteredAchievements.map((achievement, index) => 
                renderAchievementCard(achievement, index)
              )}
            </View>
          </>
        ) : (
          <>
            {/* Leaderboard Header */}
            <Animated.View style={[styles.leaderboardHeader, { opacity: fadeAnim }]}>
              <Text style={styles.leaderboardTitle}>Community Rankings</Text>
              <Text style={styles.leaderboardSubtitle}>
                See how you compare with other learners
              </Text>
            </Animated.View>

            {/* Leaderboard List */}
            <View style={styles.leaderboardList}>
              {leaderboard.map((entry, index) => renderLeaderboardEntry(entry, index))}
            </View>
          </>
        )}

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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    ...textStyles.h1,
    color: colors.midnightInk,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...textStyles.body,
    color: colors.neutralGray,
    textAlign: 'center',
  },
  statsContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsGradient: {
    padding: spacing.lg,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...textStyles.h2,
    color: colors.pureWhite,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.pureWhite,
    opacity: 0.9,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: colors.cloudGray,
    borderRadius: 12,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 8,
    gap: spacing.xs,
  },
  activeTab: {
    backgroundColor: colors.clarityBlue,
  },
  tabText: {
    ...textStyles.body,
    color: colors.neutralGray,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.pureWhite,
  },
  categoryFilter: {
    marginBottom: spacing.lg,
  },
  categoryScrollView: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.pureWhite,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  activeCategoryButton: {
    backgroundColor: colors.clarityBlue,
    borderColor: colors.clarityBlue,
  },
  categoryButtonText: {
    ...textStyles.caption,
    color: colors.neutralGray,
    fontWeight: '600',
  },
  activeCategoryButtonText: {
    color: colors.pureWhite,
  },
  achievementsGrid: {
    paddingHorizontal: spacing.lg,
  },
  achievementCard: {
    backgroundColor: colors.pureWhite,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  lockedCard: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  achievementTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
    flex: 1,
  },
  lockedTitle: {
    color: colors.neutralGray,
  },
  rarityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  achievementDescription: {
    ...textStyles.body,
    color: colors.neutralGray,
    marginBottom: spacing.md,
  },
  lockedDescription: {
    color: colors.neutralGray + '80',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pointsText: {
    ...textStyles.caption,
    color: colors.warning,
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  progressSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  progressPercentage: {
    ...textStyles.caption,
    color: colors.clarityBlue,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.cloudGray,
    borderRadius: 3,
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.clarityBlue,
    borderRadius: 3,
  },
  requirementText: {
    ...textStyles.caption,
    color: colors.neutralGray,
    fontStyle: 'italic',
  },
  cardActions: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    alignItems: 'flex-end',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.clarityBlue + '10',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: spacing.xs,
  },
  shareButtonText: {
    ...textStyles.caption,
    color: colors.clarityBlue,
    fontWeight: '600',
  },
  leaderboardHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  leaderboardTitle: {
    ...textStyles.h2,
    color: colors.midnightInk,
    marginBottom: spacing.xs,
  },
  leaderboardSubtitle: {
    ...textStyles.body,
    color: colors.neutralGray,
    textAlign: 'center',
  },
  leaderboardList: {
    paddingHorizontal: spacing.lg,
  },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pureWhite,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  currentUserEntry: {
    borderWidth: 2,
    borderColor: colors.clarityBlue,
    backgroundColor: colors.clarityBlue + '05',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    ...textStyles.h3,
    color: colors.neutralGray,
    fontWeight: '700',
  },
  topRankText: {
    color: colors.clarityBlue,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cloudGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  avatar: {
    fontSize: 20,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  username: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  currentUsername: {
    color: colors.clarityBlue,
  },
  badgeCount: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  pointsInfo: {
    alignItems: 'flex-end',
  },
  leaderboardPoints: {
    ...textStyles.h3,
    color: colors.midnightInk,
    fontWeight: '700',
  },
  pointsLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  crownContainer: {
    marginLeft: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

export default AchievementGallery;