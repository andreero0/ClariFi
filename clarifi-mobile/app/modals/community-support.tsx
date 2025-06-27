import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  MessageCircle,
  TrendingUp,
  Filter,
  Search,
  Plus,
  Star,
  MapPin,
  Clock,
  ThumbsUp,
  Shield,
  Award,
  ChevronRight,
  X,
} from 'lucide-react-native';

import { colors, typography } from '../../constants';
import { spacing } from '../../constants/spacing';
import {
  communityService,
  CommunityPost,
  CommunityTopic,
  CommunityUser,
} from '../../services/community/communityService';
import { useAuth } from '../../context/AuthContext';

const CommunitySupport: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<CommunityTopic | 'all'>(
    'all'
  );
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const topics: { key: CommunityTopic | 'all'; label: string; icon: string }[] =
    [
      { key: 'all', label: 'All Topics', icon: '🌟' },
      { key: 'banking-basics', label: 'Banking Basics', icon: '🏦' },
      { key: 'credit-building', label: 'Credit Building', icon: '📈' },
      { key: 'budgeting-tips', label: 'Budgeting Tips', icon: '💰' },
      { key: 'regional-advice', label: 'Regional Advice', icon: '📍' },
      { key: 'success-stories', label: 'Success Stories', icon: '🎉' },
      { key: 'newcomer-orientation', label: 'Newcomer Guide', icon: '🇨🇦' },
      { key: 'financial-goals', label: 'Financial Goals', icon: '🎯' },
      { key: 'tax-questions', label: 'Tax Questions', icon: '📋' },
      { key: 'insurance-advice', label: 'Insurance', icon: '🛡️' },
      { key: 'investment-basics', label: 'Investing', icon: '📊' },
    ];

  const regions = [
    { key: 'all', label: 'All Regions' },
    { key: 'GTA', label: 'Greater Toronto Area' },
    { key: 'Vancouver', label: 'Vancouver' },
    { key: 'Montreal', label: 'Montreal' },
    { key: 'Calgary', label: 'Calgary' },
    { key: 'Other', label: 'Other' },
  ];

  useEffect(() => {
    initializeCommunity();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [selectedTopic, selectedRegion]);

  const initializeCommunity = async () => {
    try {
      if (!user?.id) return;

      const communityUser = await communityService.initializeCommunityProfile(
        user.id
      );
      setCurrentUser(communityUser);

      const trending = await communityService.getTrendingTopics(
        selectedRegion === 'all' ? undefined : selectedRegion
      );
      setTrendingTopics(trending);

      await loadPosts();
    } catch (error) {
      console.error('Failed to initialize community:', error);
      Alert.alert(
        'Error',
        'Failed to load community features. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const topic =
        selectedTopic === 'all'
          ? 'banking-basics'
          : (selectedTopic as CommunityTopic);
      const region = selectedRegion === 'all' ? undefined : selectedRegion;

      const communityPosts = await communityService.getCommunityPosts(
        topic,
        region,
        20
      );
      setPosts(communityPosts);
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([initializeCommunity(), loadPosts()]);
    setRefreshing(false);
  };

  const openNewPost = () => {
    if (!currentUser) {
      Alert.alert(
        'Setup Required',
        'Please complete your community profile setup first.'
      );
      return;
    }
    setShowNewPost(true);
  };

  const openPostDetail = (post: CommunityPost) => {
    router.push({
      pathname: '/modals/community-post-detail',
      params: { postId: post.id },
    });
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderHeader = () => (
    <View style={{ padding: spacing.xl, paddingBottom: spacing.lg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              typography.h2,
              { color: colors.midnight, marginBottom: spacing.sm },
            ]}
          >
            Community Support
          </Text>
          <Text
            style={[
              typography.bodyRegular,
              { color: colors.neutralGrayPrimary },
            ]}
          >
            Connect with fellow Canadians on their financial journey
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.cloudGray,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} color={colors.neutralGrayPrimary} />
        </TouchableOpacity>
      </View>

      {currentUser && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: spacing.lg,
            padding: spacing.lg,
            backgroundColor: colors.clarityBlue + '10',
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: colors.clarityBlue,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.clarityBlue,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: spacing.md,
            }}
          >
            <Text style={[typography.h3, { color: colors.white }]}>
              {currentUser.anonymousName.charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                typography.bodyLarge,
                { color: colors.midnight, fontWeight: '600' },
              ]}
            >
              {currentUser.anonymousName}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: spacing.xs,
              }}
            >
              <Award size={16} color={colors.wisdomPurple} />
              <Text
                style={[
                  typography.bodySmall,
                  { color: colors.neutralGrayPrimary, marginLeft: spacing.xs },
                ]}
              >
                {currentUser.achievementBadges.length} badges •{' '}
                {currentUser.helpfulnessScore} helpful votes
              </Text>
            </View>
          </View>
          {currentUser.region !== 'Other' && (
            <View
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                backgroundColor: colors.skyTrust + '20',
                borderRadius: 8,
              }}
            >
              <Text
                style={[
                  typography.caption,
                  { color: colors.skyTrust, fontWeight: '600' },
                ]}
              >
                {currentUser.region}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderTrendingTopics = () => (
    <View style={{ marginBottom: spacing.xl }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.xl,
          marginBottom: spacing.md,
        }}
      >
        <Text style={[typography.h3, { color: colors.midnight }]}>
          Trending Topics
        </Text>
        <TrendingUp size={20} color={colors.growthGreen} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: spacing.xl }}
      >
        {trendingTopics.map((topic, index) => {
          const topicInfo =
            topics.find(t => t.key === topic.topic) || topics[0];
          return (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedTopic(topic.topic)}
              style={{
                marginRight: spacing.md,
                padding: spacing.lg,
                backgroundColor: colors.white,
                borderRadius: 16,
                shadowColor: colors.midnight,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
                minWidth: 140,
              }}
            >
              <Text style={{ fontSize: 24, marginBottom: spacing.sm }}>
                {topicInfo.icon}
              </Text>
              <Text
                style={[
                  typography.bodyRegular,
                  { color: colors.midnight, fontWeight: '600' },
                ]}
              >
                {topicInfo.label}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.neutralGraySecondary, marginTop: spacing.xs },
                ]}
              >
                {topic.postCount} posts • {topic.engagementScore}/10
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderFilters = () => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.lg,
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          backgroundColor: colors.cloudGray,
          borderRadius: 12,
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          height: 44,
          marginRight: spacing.md,
        }}
      >
        <Search size={20} color={colors.neutralGraySecondary} />
        <TextInput
          style={[
            typography.bodyRegular,
            {
              flex: 1,
              marginLeft: spacing.sm,
              color: colors.midnight,
            },
          ]}
          placeholder="Search posts..."
          placeholderTextColor={colors.neutralGraySecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <TouchableOpacity
        onPress={() => setShowFilters(!showFilters)}
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: showFilters ? colors.clarityBlue : colors.cloudGray,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
        }}
      >
        <Filter
          size={20}
          color={showFilters ? colors.white : colors.neutralGraySecondary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={openNewPost}
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: colors.growthGreen,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Plus size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderFilterModal = () => (
    <Modal visible={showFilters} transparent animationType="slide">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: colors.white,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: spacing.xl,
            maxHeight: '70%',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.xl,
            }}
          >
            <Text style={[typography.h3, { color: colors.midnight }]}>
              Filter Posts
            </Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={24} color={colors.neutralGrayPrimary} />
            </TouchableOpacity>
          </View>

          <Text
            style={[
              typography.bodyLarge,
              { color: colors.midnight, marginBottom: spacing.md },
            ]}
          >
            Topic
          </Text>
          <ScrollView style={{ maxHeight: 200, marginBottom: spacing.xl }}>
            {topics.map(topic => (
              <TouchableOpacity
                key={topic.key}
                onPress={() => setSelectedTopic(topic.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  backgroundColor:
                    selectedTopic === topic.key
                      ? colors.clarityBlue + '10'
                      : 'transparent',
                  borderRadius: 12,
                  marginBottom: spacing.sm,
                }}
              >
                <Text style={{ fontSize: 20, marginRight: spacing.md }}>
                  {topic.icon}
                </Text>
                <Text
                  style={[
                    typography.bodyRegular,
                    {
                      color:
                        selectedTopic === topic.key
                          ? colors.clarityBlue
                          : colors.midnight,
                      fontWeight: selectedTopic === topic.key ? '600' : '400',
                    },
                  ]}
                >
                  {topic.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text
            style={[
              typography.bodyLarge,
              { color: colors.midnight, marginBottom: spacing.md },
            ]}
          >
            Region
          </Text>
          {regions.map(region => (
            <TouchableOpacity
              key={region.key}
              onPress={() => setSelectedRegion(region.key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                backgroundColor:
                  selectedRegion === region.key
                    ? colors.skyTrust + '10'
                    : 'transparent',
                borderRadius: 12,
                marginBottom: spacing.sm,
              }}
            >
              <MapPin
                size={20}
                color={
                  selectedRegion === region.key
                    ? colors.skyTrust
                    : colors.neutralGraySecondary
                }
              />
              <Text
                style={[
                  typography.bodyRegular,
                  {
                    marginLeft: spacing.md,
                    color:
                      selectedRegion === region.key
                        ? colors.skyTrust
                        : colors.midnight,
                    fontWeight: selectedRegion === region.key ? '600' : '400',
                  },
                ]}
              >
                {region.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  const renderPost = (post: CommunityPost) => (
    <TouchableOpacity
      key={post.id}
      onPress={() => openPostDetail(post)}
      style={{
        backgroundColor: colors.white,
        marginHorizontal: spacing.xl,
        marginBottom: spacing.lg,
        borderRadius: 16,
        padding: spacing.xl,
        shadowColor: colors.midnight,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: spacing.md,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.wisdomPurple,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
          }}
        >
          <Text
            style={[
              typography.bodyRegular,
              { color: colors.white, fontWeight: '600' },
            ]}
          >
            {post.authorName.charAt(0)}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: spacing.xs,
            }}
          >
            <Text
              style={[
                typography.bodyRegular,
                { color: colors.midnight, fontWeight: '600' },
              ]}
            >
              {post.authorName}
            </Text>
            {post.replies.some(r => r.isVerified) && (
              <Shield
                size={16}
                color={colors.growthGreen}
                style={{ marginLeft: spacing.sm }}
              />
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Clock size={14} color={colors.neutralGraySecondary} />
            <Text
              style={[
                typography.caption,
                { color: colors.neutralGraySecondary, marginLeft: spacing.xs },
              ]}
            >
              {formatTimeAgo(post.createdAt)}
            </Text>
            {post.region && (
              <>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: colors.neutralGraySecondary,
                      marginHorizontal: spacing.sm,
                    },
                  ]}
                >
                  •
                </Text>
                <MapPin size={14} color={colors.neutralGraySecondary} />
                <Text
                  style={[
                    typography.caption,
                    {
                      color: colors.neutralGraySecondary,
                      marginLeft: spacing.xs,
                    },
                  ]}
                >
                  {post.region}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      <Text
        style={[
          typography.bodyLarge,
          {
            color: colors.midnight,
            marginBottom: spacing.sm,
            fontWeight: '600',
          },
        ]}
      >
        {post.title}
      </Text>

      <Text
        style={[
          typography.bodyRegular,
          { color: colors.neutralGrayPrimary, lineHeight: 22 },
        ]}
        numberOfLines={3}
      >
        {post.content}
      </Text>

      {post.tags.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginTop: spacing.md,
            marginBottom: spacing.sm,
          }}
        >
          {post.tags.slice(0, 3).map((tag, index) => (
            <View
              key={index}
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                backgroundColor: colors.skyTrust + '15',
                borderRadius: 8,
                marginRight: spacing.sm,
                marginBottom: spacing.xs,
              }}
            >
              <Text
                style={[
                  typography.caption,
                  { color: colors.skyTrust, fontWeight: '600' },
                ]}
              >
                #{tag}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: spacing.md,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.borderDivider,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: spacing.lg,
            }}
          >
            <ThumbsUp
              size={18}
              color={
                post.isHelpful
                  ? colors.growthGreen
                  : colors.neutralGraySecondary
              }
            />
            <Text
              style={[
                typography.bodySmall,
                {
                  color: post.isHelpful
                    ? colors.growthGreen
                    : colors.neutralGraySecondary,
                  marginLeft: spacing.xs,
                  fontWeight: post.isHelpful ? '600' : '400',
                },
              ]}
            >
              {post.upvotes}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MessageCircle size={18} color={colors.neutralGraySecondary} />
            <Text
              style={[
                typography.bodySmall,
                { color: colors.neutralGraySecondary, marginLeft: spacing.xs },
              ]}
            >
              {post.replies.length}
            </Text>
          </View>
        </View>

        <ChevronRight size={18} color={colors.neutralGraySecondary} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.appBackground }}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.appBackground}
        />
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text
            style={[typography.bodyLarge, { color: colors.neutralGrayPrimary }]}
          >
            Loading community...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.appBackground}
      />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderTrendingTopics()}
        {renderFilters()}

        <View style={{ paddingBottom: spacing.xxl }}>
          {posts.length > 0 ? (
            posts.map(post => renderPost(post))
          ) : (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                padding: spacing.xxl,
              }}
            >
              <Users size={48} color={colors.neutralGraySecondary} />
              <Text
                style={[
                  typography.h3,
                  {
                    color: colors.midnight,
                    marginTop: spacing.lg,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                No posts yet
              </Text>
              <Text
                style={[
                  typography.bodyRegular,
                  { color: colors.neutralGrayPrimary, textAlign: 'center' },
                ]}
              >
                Be the first to start a conversation in this topic!
              </Text>
              <TouchableOpacity
                onPress={openNewPost}
                style={{
                  marginTop: spacing.lg,
                  paddingHorizontal: spacing.xl,
                  paddingVertical: spacing.md,
                  backgroundColor: colors.growthGreen,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={[
                    typography.bodyRegular,
                    { color: colors.white, fontWeight: '600' },
                  ]}
                >
                  Create First Post
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {renderFilterModal()}
    </SafeAreaView>
  );
};

export default CommunitySupport;
