import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  ThumbsUp,
  MessageCircle,
  Send,
  Shield,
  Clock,
  MapPin,
  Flag,
  MoreVertical,
  Award,
  Hash,
} from 'lucide-react-native';

import { colors, typography } from '../../constants';
import { spacing } from '../../constants/spacing';
import {
  communityService,
  CommunityPost,
  CommunityReply,
} from '../../services/community/communityService';
import { useAuth } from '../../context/AuthContext';

const CommunityPostDetail: React.FC = () => {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { user } = useAuth();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      // In a real implementation, you'd fetch the specific post
      // For now, we'll use sample data
      const samplePost: CommunityPost = {
        id: postId || 'sample_1',
        authorId: 'sample_user_1',
        authorName: 'Helpful Maple',
        topic: 'credit-building',
        title: 'How I built credit from zero in 6 months',
        content: `When I arrived in Canada, I had no credit history. Here's what worked for me:

1. **Started with a secured credit card** - Put down a $500 deposit with TD Bank
2. **Used it for small purchases** - Only spent about 10% of the limit
3. **Always paid in full** - Set up automatic payments to never miss a due date
4. **Got a cell phone plan** - This helped establish more credit history
5. **Checked my credit score monthly** - Used Credit Karma to monitor progress

After 6 months, my score went from 0 to 680! The key is patience and consistency.

Has anyone else used this strategy? What worked best for you?`,
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        isAnonymous: true,
        region: 'GTA',
        replies: [
          {
            id: 'reply_1',
            authorId: 'sample_user_2',
            authorName: 'Wise Bear',
            content:
              'Great tips! I did something similar with a secured credit card from RBC. The automatic payments are key - I almost missed one payment and learned my lesson quickly!',
            createdAt: new Date(Date.now() - 43200000), // 12 hours ago
            upvotes: 12,
            isHelpful: true,
            isVerified: true,
          },
          {
            id: 'reply_2',
            authorId: 'sample_user_3',
            authorName: 'Smart Wolf',
            content:
              "How much did your score improve each month? I'm at month 3 and only seeing small changes.",
            createdAt: new Date(Date.now() - 21600000), // 6 hours ago
            upvotes: 3,
            isHelpful: false,
            isVerified: false,
          },
        ],
        upvotes: 28,
        isHelpful: true,
        moderationStatus: 'approved',
        tags: ['credit-building', 'newcomer-tips', 'secured-card'],
      };

      setPost(samplePost);
    } catch (error) {
      console.error('Failed to load post:', error);
      Alert.alert('Error', 'Failed to load post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!post) return;

    // Toggle upvote
    const newUpvotes = post.isHelpful ? post.upvotes - 1 : post.upvotes + 1;
    const newIsHelpful = !post.isHelpful;

    setPost({
      ...post,
      upvotes: newUpvotes,
      isHelpful: newIsHelpful,
    });
  };

  const handleReplyUpvote = (replyId: string) => {
    if (!post) return;

    const updatedReplies = post.replies.map(reply => {
      if (reply.id === replyId) {
        return {
          ...reply,
          upvotes: reply.isHelpful ? reply.upvotes - 1 : reply.upvotes + 1,
          isHelpful: !reply.isHelpful,
        };
      }
      return reply;
    });

    setPost({
      ...post,
      replies: updatedReplies,
    });
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Required', 'Please enter a reply.');
      return;
    }

    if (replyText.length < 10) {
      Alert.alert(
        'Too Short',
        'Please provide more detail in your reply (at least 10 characters).'
      );
      return;
    }

    setSubmittingReply(true);

    try {
      await communityService.replyToPost(
        post?.id || '',
        replyText.trim(),
        true
      );

      // Add the new reply to the post
      const newReply: CommunityReply = {
        id: `reply_${Date.now()}`,
        authorId: user?.id || 'current_user',
        authorName: 'You',
        content: replyText.trim(),
        createdAt: new Date(),
        upvotes: 0,
        isHelpful: false,
        isVerified: false,
      };

      if (post) {
        setPost({
          ...post,
          replies: [...post.replies, newReply],
        });
      }

      setReplyText('');
      Alert.alert(
        'Reply Posted',
        'Your reply has been added to the discussion.'
      );
    } catch (error) {
      console.error('Failed to submit reply:', error);

      if (
        error instanceof Error &&
        error.message.includes('community guidelines')
      ) {
        Alert.alert(
          'Content Moderation',
          'Your reply contains content that may not meet our community guidelines. Please review and try again.'
        );
      } else {
        Alert.alert('Error', 'Failed to post reply. Please try again.');
      }
    } finally {
      setSubmittingReply(false);
    }
  };

  const reportPost = () => {
    Alert.alert('Report Post', 'Why are you reporting this post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Spam', onPress: () => submitReport('spam') },
      {
        text: 'Inappropriate Content',
        onPress: () => submitReport('inappropriate'),
      },
      { text: 'Misinformation', onPress: () => submitReport('misinformation') },
      { text: 'Other', onPress: () => submitReport('other') },
    ]);
  };

  const submitReport = async (reason: string) => {
    try {
      await communityService.reportContent(post?.id || '', 'post', reason);
      Alert.alert(
        'Thank You',
        'Your report has been submitted and will be reviewed by our moderation team.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
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
            Loading post...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
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
            Post not found
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing.lg,
            backgroundColor: colors.white,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderDivider,
          }}
        >
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
            <ArrowLeft size={20} color={colors.neutralGrayPrimary} />
          </TouchableOpacity>

          <Text style={[typography.h3, { color: colors.midnight }]}>
            Discussion
          </Text>

          <TouchableOpacity
            onPress={reportPost}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.cloudGray,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MoreVertical size={20} color={colors.neutralGrayPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Post Content */}
          <View
            style={{
              backgroundColor: colors.white,
              margin: spacing.lg,
              borderRadius: 16,
              padding: spacing.xl,
              shadowColor: colors.midnight,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            {/* Post Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: spacing.lg,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.wisdomPurple,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.md,
                }}
              >
                <Text style={[typography.h3, { color: colors.white }]}>
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
                      typography.bodyLarge,
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
                      {
                        color: colors.neutralGraySecondary,
                        marginLeft: spacing.xs,
                      },
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

            {/* Post Title */}
            <Text
              style={[
                typography.h2,
                {
                  color: colors.midnight,
                  marginBottom: spacing.md,
                  lineHeight: 32,
                },
              ]}
            >
              {post.title}
            </Text>

            {/* Post Content */}
            <Text
              style={[
                typography.bodyRegular,
                {
                  color: colors.neutralGrayPrimary,
                  lineHeight: 24,
                  marginBottom: spacing.lg,
                },
              ]}
            >
              {post.content}
            </Text>

            {/* Tags */}
            {post.tags.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  marginBottom: spacing.lg,
                }}
              >
                {post.tags.map((tag, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      backgroundColor: colors.skyTrust + '15',
                      borderRadius: 8,
                      marginRight: spacing.sm,
                      marginBottom: spacing.xs,
                    }}
                  >
                    <Hash size={12} color={colors.skyTrust} />
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: colors.skyTrust,
                          fontWeight: '600',
                          marginLeft: spacing.xs,
                        },
                      ]}
                    >
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Post Actions */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: spacing.md,
                borderTopWidth: 1,
                borderTopColor: colors.borderDivider,
              }}
            >
              <TouchableOpacity
                onPress={handleUpvote}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <ThumbsUp
                  size={20}
                  color={
                    post.isHelpful
                      ? colors.growthGreen
                      : colors.neutralGraySecondary
                  }
                  fill={post.isHelpful ? colors.growthGreen : 'transparent'}
                />
                <Text
                  style={[
                    typography.bodyRegular,
                    {
                      color: post.isHelpful
                        ? colors.growthGreen
                        : colors.neutralGraySecondary,
                      marginLeft: spacing.sm,
                      fontWeight: post.isHelpful ? '600' : '400',
                    },
                  ]}
                >
                  {post.upvotes} Helpful
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MessageCircle size={20} color={colors.neutralGraySecondary} />
                <Text
                  style={[
                    typography.bodyRegular,
                    {
                      color: colors.neutralGraySecondary,
                      marginLeft: spacing.sm,
                    },
                  ]}
                >
                  {post.replies.length} Replies
                </Text>
              </View>
            </View>
          </View>

          {/* Replies Section */}
          <View
            style={{ marginHorizontal: spacing.lg, marginBottom: spacing.lg }}
          >
            <Text
              style={[
                typography.h3,
                { color: colors.midnight, marginBottom: spacing.md },
              ]}
            >
              Replies ({post.replies.length})
            </Text>

            {post.replies.map(reply => (
              <View
                key={reply.id}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: 12,
                  padding: spacing.lg,
                  marginBottom: spacing.md,
                  shadowColor: colors.midnight,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                {/* Reply Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: spacing.md,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: reply.isVerified
                        ? colors.growthGreen
                        : colors.skyTrust,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: spacing.md,
                    }}
                  >
                    {reply.isVerified ? (
                      <Shield size={16} color={colors.white} />
                    ) : (
                      <Text
                        style={[
                          typography.bodyRegular,
                          { color: colors.white, fontWeight: '600' },
                        ]}
                      >
                        {reply.authorName.charAt(0)}
                      </Text>
                    )}
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
                        {reply.authorName}
                      </Text>
                      {reply.isVerified && (
                        <View
                          style={{
                            paddingHorizontal: spacing.sm,
                            paddingVertical: 2,
                            backgroundColor: colors.growthGreen + '20',
                            borderRadius: 8,
                            marginLeft: spacing.sm,
                          }}
                        >
                          <Text
                            style={[
                              typography.caption,
                              { color: colors.growthGreen, fontWeight: '600' },
                            ]}
                          >
                            Verified Helper
                          </Text>
                        </View>
                      )}
                    </View>

                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Clock size={12} color={colors.neutralGraySecondary} />
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: colors.neutralGraySecondary,
                            marginLeft: spacing.xs,
                          },
                        ]}
                      >
                        {formatTimeAgo(reply.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Reply Content */}
                <Text
                  style={[
                    typography.bodyRegular,
                    {
                      color: colors.neutralGrayPrimary,
                      lineHeight: 22,
                      marginBottom: spacing.md,
                    },
                  ]}
                >
                  {reply.content}
                </Text>

                {/* Reply Actions */}
                <TouchableOpacity
                  onPress={() => handleReplyUpvote(reply.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                  }}
                >
                  <ThumbsUp
                    size={16}
                    color={
                      reply.isHelpful
                        ? colors.growthGreen
                        : colors.neutralGraySecondary
                    }
                    fill={reply.isHelpful ? colors.growthGreen : 'transparent'}
                  />
                  <Text
                    style={[
                      typography.bodySmall,
                      {
                        color: reply.isHelpful
                          ? colors.growthGreen
                          : colors.neutralGraySecondary,
                        marginLeft: spacing.xs,
                        fontWeight: reply.isHelpful ? '600' : '400',
                      },
                    ]}
                  >
                    {reply.upvotes}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Reply Input */}
        <View
          style={{
            backgroundColor: colors.white,
            borderTopWidth: 1,
            borderTopColor: colors.borderDivider,
            padding: spacing.lg,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              backgroundColor: colors.cloudGray,
              borderRadius: 20,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <TextInput
              style={{
                flex: 1,
                maxHeight: 100,
                fontSize: 16,
                color: colors.midnight,
                paddingVertical: spacing.sm,
              }}
              placeholder="Add a helpful reply..."
              placeholderTextColor={colors.neutralGraySecondary}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              onPress={handleSubmitReply}
              disabled={!replyText.trim() || submittingReply}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor:
                  replyText.trim() && !submittingReply
                    ? colors.clarityBlue
                    : colors.neutralGraySecondary,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: spacing.sm,
              }}
            >
              <Send size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CommunityPostDetail;
