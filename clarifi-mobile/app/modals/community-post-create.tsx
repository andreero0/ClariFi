import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import {
  X,
  Send,
  Shield,
  Eye,
  EyeOff,
  Hash,
  MapPin,
  AlertCircle,
} from 'lucide-react-native';

import { colors, typography } from '../../constants';
import { spacing } from '../../constants/spacing';
import {
  communityService,
  CommunityTopic,
} from '../../services/community/communityService';
import { useAuth } from '../../context/AuthContext';

const CommunityPostCreate: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [selectedTopic, setSelectedTopic] =
    useState<CommunityTopic>('banking-basics');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const topics: {
    key: CommunityTopic;
    label: string;
    icon: string;
    description: string;
  }[] = [
    {
      key: 'banking-basics',
      label: 'Banking Basics',
      icon: '🏦',
      description: 'Questions about Canadian banks, accounts, and services',
    },
    {
      key: 'credit-building',
      label: 'Credit Building',
      icon: '📈',
      description: 'Tips and advice for building credit history in Canada',
    },
    {
      key: 'budgeting-tips',
      label: 'Budgeting Tips',
      icon: '💰',
      description: 'Share budgeting strategies and expense management',
    },
    {
      key: 'regional-advice',
      label: 'Regional Advice',
      icon: '📍',
      description: 'Location-specific financial advice and recommendations',
    },
    {
      key: 'success-stories',
      label: 'Success Stories',
      icon: '🎉',
      description: 'Celebrate your financial milestones and achievements',
    },
    {
      key: 'newcomer-orientation',
      label: 'Newcomer Guide',
      icon: '🇨🇦',
      description: 'Essential financial information for new Canadians',
    },
    {
      key: 'financial-goals',
      label: 'Financial Goals',
      icon: '🎯',
      description: 'Set and track your financial objectives',
    },
    {
      key: 'tax-questions',
      label: 'Tax Questions',
      icon: '📋',
      description: 'Canadian tax system questions and general guidance',
    },
    {
      key: 'insurance-advice',
      label: 'Insurance',
      icon: '🛡️',
      description: 'Health, auto, and other insurance topics',
    },
    {
      key: 'investment-basics',
      label: 'Investing',
      icon: '📊',
      description: 'Introduction to investing in Canadian markets',
    },
  ];

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim().toLowerCase()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a title for your post.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Required Field', 'Please enter some content for your post.');
      return;
    }

    if (content.length < 20) {
      Alert.alert(
        'Content Too Short',
        'Please provide more detail in your post (at least 20 characters).'
      );
      return;
    }

    setSubmitting(true);

    try {
      await communityService.createCommunityPost(
        selectedTopic,
        title.trim(),
        content.trim(),
        isAnonymous,
        tags
      );

      Alert.alert(
        'Post Created!',
        'Your post has been submitted for moderation and will appear in the community soon.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to create post:', error);

      if (
        error instanceof Error &&
        error.message.includes('community guidelines')
      ) {
        Alert.alert(
          'Content Moderation',
          'Your post contains content that may not meet our community guidelines. Please review and try again.',
          [
            {
              text: 'Review Guidelines',
              onPress: () => router.push('/modals/community-guidelines'),
            },
            { text: 'Edit Post', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create post. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = title.trim().length > 0 && content.trim().length >= 20;

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
            borderBottomWidth: 1,
            borderBottomColor: colors.borderDivider,
            backgroundColor: colors.white,
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
            <X size={20} color={colors.neutralGrayPrimary} />
          </TouchableOpacity>

          <Text style={[typography.h3, { color: colors.midnight }]}>
            Create Post
          </Text>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isFormValid || submitting}
            style={{
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              backgroundColor:
                isFormValid && !submitting
                  ? colors.growthGreen
                  : colors.neutralGraySecondary,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Send size={16} color={colors.white} />
            <Text
              style={[
                typography.bodyRegular,
                {
                  color: colors.white,
                  marginLeft: spacing.xs,
                  fontWeight: '600',
                },
              ]}
            >
              {submitting ? 'Posting...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Privacy Notice */}
          <View
            style={{
              margin: spacing.lg,
              padding: spacing.lg,
              backgroundColor: colors.clarityBlue + '10',
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: colors.clarityBlue,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: spacing.sm,
              }}
            >
              <Shield size={20} color={colors.clarityBlue} />
              <Text
                style={[
                  typography.bodyLarge,
                  {
                    color: colors.clarityBlue,
                    marginLeft: spacing.sm,
                    fontWeight: '600',
                  },
                ]}
              >
                Privacy Protected
              </Text>
            </View>
            <Text
              style={[
                typography.bodyRegular,
                { color: colors.neutralGrayPrimary, lineHeight: 20 },
              ]}
            >
              Your posts are anonymous by default. We never share personal
              information, and all discussions stay within our secure community.
            </Text>
          </View>

          {/* Topic Selection */}
          <View style={{ margin: spacing.lg }}>
            <Text
              style={[
                typography.h3,
                { color: colors.midnight, marginBottom: spacing.md },
              ]}
            >
              Choose Topic
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {topics.map(topic => (
                <TouchableOpacity
                  key={topic.key}
                  onPress={() => setSelectedTopic(topic.key)}
                  style={{
                    marginRight: spacing.md,
                    padding: spacing.lg,
                    backgroundColor:
                      selectedTopic === topic.key
                        ? colors.clarityBlue
                        : colors.white,
                    borderRadius: 16,
                    borderWidth: selectedTopic === topic.key ? 0 : 1,
                    borderColor: colors.borderDivider,
                    minWidth: 140,
                    shadowColor: colors.midnight,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: selectedTopic === topic.key ? 0.15 : 0.05,
                    shadowRadius: 8,
                    elevation: selectedTopic === topic.key ? 6 : 2,
                  }}
                >
                  <Text style={{ fontSize: 24, marginBottom: spacing.sm }}>
                    {topic.icon}
                  </Text>
                  <Text
                    style={[
                      typography.bodyRegular,
                      {
                        color:
                          selectedTopic === topic.key
                            ? colors.white
                            : colors.midnight,
                        fontWeight: '600',
                        marginBottom: spacing.xs,
                      },
                    ]}
                  >
                    {topic.label}
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      {
                        color:
                          selectedTopic === topic.key
                            ? colors.white + 'CC'
                            : colors.neutralGraySecondary,
                        lineHeight: 16,
                      },
                    ]}
                  >
                    {topic.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Anonymous Toggle */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginHorizontal: spacing.lg,
              marginBottom: spacing.lg,
              padding: spacing.lg,
              backgroundColor: colors.white,
              borderRadius: 12,
              shadowColor: colors.midnight,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: spacing.xs,
                }}
              >
                {isAnonymous ? (
                  <EyeOff size={20} color={colors.wisdomPurple} />
                ) : (
                  <Eye size={20} color={colors.skyTrust} />
                )}
                <Text
                  style={[
                    typography.bodyLarge,
                    {
                      color: colors.midnight,
                      marginLeft: spacing.sm,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {isAnonymous ? 'Anonymous Post' : 'Public Post'}
                </Text>
              </View>
              <Text
                style={[
                  typography.bodySmall,
                  { color: colors.neutralGrayPrimary },
                ]}
              >
                {isAnonymous
                  ? 'Your identity stays private with a generated username'
                  : 'Post with your ClariFi community username'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setIsAnonymous(!isAnonymous)}
              style={{
                width: 50,
                height: 30,
                borderRadius: 15,
                backgroundColor: isAnonymous
                  ? colors.wisdomPurple
                  : colors.neutralGraySecondary,
                justifyContent: 'center',
                paddingHorizontal: 2,
              }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: colors.white,
                  transform: [{ translateX: isAnonymous ? 22 : 2 }],
                  shadowColor: colors.midnight,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              />
            </TouchableOpacity>
          </View>

          {/* Title Input */}
          <View
            style={{ marginHorizontal: spacing.lg, marginBottom: spacing.lg }}
          >
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
              Title *
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.white,
                borderRadius: 12,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: title.trim()
                  ? colors.clarityBlue + '40'
                  : colors.borderDivider,
                fontSize: 16,
                color: colors.midnight,
                shadowColor: colors.midnight,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
              placeholder="What's your question or topic?"
              placeholderTextColor={colors.neutralGraySecondary}
              value={title}
              onChangeText={setTitle}
              maxLength={120}
            />
            <Text
              style={[
                typography.caption,
                {
                  color: colors.neutralGraySecondary,
                  marginTop: spacing.xs,
                  textAlign: 'right',
                },
              ]}
            >
              {title.length}/120
            </Text>
          </View>

          {/* Content Input */}
          <View
            style={{ marginHorizontal: spacing.lg, marginBottom: spacing.lg }}
          >
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
              Content *
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.white,
                borderRadius: 12,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor:
                  content.length >= 20
                    ? colors.growthGreen + '40'
                    : colors.borderDivider,
                fontSize: 16,
                color: colors.midnight,
                textAlignVertical: 'top',
                minHeight: 120,
                shadowColor: colors.midnight,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
              placeholder="Share your experience, ask a question, or provide helpful advice..."
              placeholderTextColor={colors.neutralGraySecondary}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={2000}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: spacing.xs,
              }}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color:
                      content.length >= 20
                        ? colors.growthGreen
                        : colors.neutralGraySecondary,
                  },
                ]}
              >
                {content.length >= 20
                  ? '✓ Minimum length met'
                  : `${Math.max(0, 20 - content.length)} more characters needed`}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.neutralGraySecondary },
                ]}
              >
                {content.length}/2000
              </Text>
            </View>
          </View>

          {/* Tags */}
          <View
            style={{ marginHorizontal: spacing.lg, marginBottom: spacing.xl }}
          >
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
              Tags (Optional)
            </Text>

            {tags.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  marginBottom: spacing.md,
                }}
              >
                {tags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => removeTag(tag)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      backgroundColor: colors.skyTrust + '15',
                      borderRadius: 16,
                      marginRight: spacing.sm,
                      marginBottom: spacing.sm,
                    }}
                  >
                    <Hash size={14} color={colors.skyTrust} />
                    <Text
                      style={[
                        typography.bodySmall,
                        {
                          color: colors.skyTrust,
                          marginHorizontal: spacing.xs,
                        },
                      ]}
                    >
                      {tag}
                    </Text>
                    <X size={14} color={colors.skyTrust} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {tags.length < 5 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.white,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.borderDivider,
                  paddingHorizontal: spacing.md,
                  shadowColor: colors.midnight,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Hash size={20} color={colors.neutralGraySecondary} />
                <TextInput
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    fontSize: 16,
                    color: colors.midnight,
                  }}
                  placeholder="Add a tag..."
                  placeholderTextColor={colors.neutralGraySecondary}
                  value={newTag}
                  onChangeText={setNewTag}
                  onSubmitEditing={addTag}
                  returnKeyType="done"
                  maxLength={20}
                />
                {newTag.trim() && (
                  <TouchableOpacity
                    onPress={addTag}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      backgroundColor: colors.clarityBlue,
                      borderRadius: 8,
                      marginRight: spacing.sm,
                    }}
                  >
                    <Text
                      style={[
                        typography.bodySmall,
                        { color: colors.white, fontWeight: '600' },
                      ]}
                    >
                      Add
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Community Guidelines Reminder */}
          <View
            style={{
              margin: spacing.lg,
              padding: spacing.lg,
              backgroundColor: colors.warning + '15',
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: colors.warning,
              marginBottom: spacing.xxl,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: spacing.sm,
              }}
            >
              <AlertCircle size={20} color={colors.warning} />
              <Text
                style={[
                  typography.bodyLarge,
                  {
                    color: colors.warning,
                    marginLeft: spacing.sm,
                    fontWeight: '600',
                  },
                ]}
              >
                Community Guidelines
              </Text>
            </View>
            <Text
              style={[
                typography.bodyRegular,
                { color: colors.neutralGrayPrimary, lineHeight: 20 },
              ]}
            >
              Keep discussions respectful and relevant. Don't share personal
              financial details or account information. Posts are moderated for
              safety.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CommunityPostCreate;
